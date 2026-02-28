// scraper/Scraper.ts
import puppeteer, { Browser, Page } from "puppeteer";
import { ScraperDatabaseService } from "@/services/scraper.service";
import { ScrapeJob } from "@/models/ScrapeJob";
import type {
    ProgramScrapingType,
    PaginationInfo,
    ScrapeResult,
    FilterFieldsScrapingType,
} from "@/types";

// ─── URLs ─────────────────────────────────────────────────────────────────────
const BASE_URL = "https://partner.unitededucation.com";
const LOGIN_URL = `${BASE_URL}/Account/Login/`;
const PROGRAM_SEARCH_URL = `${BASE_URL}/Manage/ProgramSearch`;

// ─── Resource blocking ────────────────────────────────────────────────────────
const BLOCKED_RESOURCE_TYPES = new Set([
    "image",
    "media",
    "font",
    "imageset",
    "texttrack",
    "eventsource",
    "websocket",
    "manifest",
]);

const BLOCKED_URL_PATTERNS: RegExp[] = [
    /clarity\.ms/,
    /google-analytics\.com/,
    /googletagmanager\.com/,
    /doubleclick\.net/,
    /facebook\.net/,
    /hotjar\.com/,
    /intercom\.io/,
    /segment\.com/,
    /mixpanel\.com/,
    /\.(png|jpe?g|gif|webp|svg|ico|avif|bmp|tiff)(\?|#|$)/i,
    /\.(mp4|webm|ogg|mp3|wav)(\?|#|$)/i,
    /\.(woff2?|ttf|eot|otf)(\?|#|$)/i,
];

function shouldBlock(resourceType: string, url: string): boolean {
    if (BLOCKED_RESOURCE_TYPES.has(resourceType)) return true;
    if (BLOCKED_URL_PATTERNS.some((re) => re.test(url))) return true;
    return false;
}

// ─── Selectors ────────────────────────────────────────────────────────────────
const SEL = {
    LOGIN_FORM: "#kt_sign_in_form",
    EMAIL: "#Email",
    PASSWORD: "#Password",
    SUBMIT: "#kt_sign_in_submit",
    AUTH_ERROR: ".text-danger",
    TERM_RADIO: 'input[name="radio_buttons_2"]',
    CONTINUE_BTN: "#kt_button_1",
    UNIVERSITY: "#selectuniversity",
    PROGRAM: "#selectprogram",
    DEGREE: "#selectdegree",
    LANGUAGE: "#selectlang",
    CAMPUS: "#selectcampus",
    STEPPER: "#kt_stepper_example_basic",
    PAGE_INFO: "#page-info",
    NO_DATA: ".no-data-message",
    CARDS: "#cards-container",
} as const;

const CARD_SELECTORS = [
    "#cards-container .col-lg-4",
    "#cards-container .col-xl-3",
    "#cards-container .col-md-4",
    "#cards-container .card",
    ".program-card",
];

// ─── Helper: Extract names from JSON ─────────────────────────────────────────
function extractNames(json: unknown): string[] {
    if (Array.isArray(json)) {
        if (json.every((v) => typeof v === "string")) return (json as string[]).filter(Boolean);
        const NAME_KEYS = ["name", "Name", "text", "Text", "label", "Label", "title", "Title", "value", "Value"];
        const out: string[] = [];
        for (const item of json) {
            if (item && typeof item === "object") {
                for (const k of NAME_KEYS) {
                    const v = (item as Record<string, unknown>)[k];
                    if (typeof v === "string" && v.trim()) { out.push(v.trim()); break; }
                }
            }
        }
        return out;
    }
    if (json && typeof json === "object") {
        const WRAPPERS = ["data", "Data", "result", "Result", "items", "Items",
            "universities", "programs", "degrees", "languages", "campuses"];
        for (const k of WRAPPERS) {
            const v = (json as Record<string, unknown>)[k];
            if (Array.isArray(v)) return extractNames(v);
        }
    }
    return [];
}

// ─── Scraper Class ────────────────────────────────────────────────────────────
export class Scraper {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private isAuthenticated = false;
    private isScraping = false;
    private initPromise: Promise<void> | null = null;
    private readonly email: string;
    private readonly password: string;
    private readonly headless: boolean;
    private readonly timeout: number;
    private _interceptedFilters: FilterFieldsScrapingType | null = null;
    private _cardsLoadedAfterTermSelect = false;

    constructor(options: {
        email?: string;
        password?: string;
        headless?: boolean;
        timeout?: number;
    } = {}) {
        this.email = options.email ?? process.env.SCRAPER_EMAIL!;
        this.password = options.password ?? process.env.SCRAPER_PASSWORD!;
        this.headless = options.headless ?? true;
        this.timeout = options.timeout ?? 120_000;
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * Returns all available term radio options from the ProgramSearch page.
     */
    async getAvailableTerms(): Promise<{ value: string; text: string }[]> {
        await this.ensureReady();
        console.log("Navigating to ProgramSearch…");
        await this.goto(PROGRAM_SEARCH_URL, "domcontentloaded");
        await this.wait(3000);

        const currentUrl = this.page!.url();
        console.log(`Current URL after navigation: ${currentUrl}`);

        if (!currentUrl.includes("/Manage/ProgramSearch")) {
            console.warn("Not on ProgramSearch — session may have expired, re-logging in…");
            this.isAuthenticated = false;
            await this.login();
            await this.goto(PROGRAM_SEARCH_URL, "domcontentloaded");
            await this.wait(3000);
            console.log(`URL after re-login: ${this.page!.url()}`);
        }

        await this.page!.waitForSelector(SEL.TERM_RADIO, { timeout: 20_000 });
        return this.readTermRadios();
    }

    /**
     * Scrape all programs for a given term value (radio button value) and
     * persist everything to MongoDB.
     *
     * @param termValue  The raw radio value (e.g. "1", "2") returned by getAvailableTerms()
     * @param userId     Optional user identifier stored on the ScrapeJob
     */
    async scrapeTerm(termValue: string, userId = "system"): Promise<void> {
        if (this.isScraping) throw new Error("A scrape job is already running.");

        await this.ensureReady();

        // Re-navigate so we always have a fresh list of terms
        const terms = await this.getAvailableTerms();
        const term = terms.find((t) => t.value === termValue);
        if (!term) {
            throw new Error(
                `Term "${termValue}" not found. Available: ${terms.map((t) => `${t.text} (${t.value})`).join(", ")}`
            );
        }

        this.isScraping = true;
        try {
            await this.runScrapeJob(term.value, term.text, userId);
        } finally {
            this.isScraping = false;
        }
    }

    getStatus() {
        return {
            isAuthenticated: this.isAuthenticated,
            isScraping: this.isScraping,
            browserOpen: this.browser !== null,
        };
    }

    async destroy(): Promise<void> {
        this.isAuthenticated = false;
        this.isScraping = false;
        await this.browser?.close().catch(() => { });
        this.browser = null;
        this.page = null;
        console.log("Scraper destroyed.");
    }

    // ─── Init ─────────────────────────────────────────────────────────────────
    private async ensureReady(): Promise<void> {
        if (this.browser && this.isAuthenticated) return;
        if (!this.initPromise) {
            this.initPromise = this.boot().finally(() => { this.initPromise = null; });
        }
        await this.initPromise;
    }

    private async boot(): Promise<void> {
        await this.browser?.close().catch(() => { });
        this.browser = null;
        this.page = null;
        this.isAuthenticated = false;

        console.log("Launching browser…");
        this.browser = await puppeteer.launch({
            headless: this.headless,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-blink-features=AutomationControlled",
                "--window-size=1366,768",
            ],
        });

        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1366, height: 768 });
        await this.page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );
        await this.page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

        await this.page.setRequestInterception(true);
        this.page.on("request", (req) => {
            shouldBlock(req.resourceType(), req.url()) ? req.abort() : req.continue();
        });
        this.page.on("response", (res) => {
            const t = res.request().resourceType();
            if (t === "xhr" || t === "fetch") {
                console.log(`[AJAX] ${res.status()} ${res.url()}`);
            }
        });

        await this.login();
        console.log("Scraper ready.");
    }

    // ─── Auth ─────────────────────────────────────────────────────────────────
    private async login(): Promise<void> {
        console.log("Logging in…");
        await this.goto(LOGIN_URL, "networkidle2");
        await this.waitFor(SEL.LOGIN_FORM);
        await this.page!.type(SEL.EMAIL, this.email, { delay: 80 });
        await this.page!.type(SEL.PASSWORD, this.password, { delay: 80 });
        await this.wait(1500);
        await this.page!.click(SEL.SUBMIT);
        await this.page!
            .waitForNavigation({ waitUntil: "networkidle2", timeout: this.timeout })
            .catch(() => { });

        if (this.page!.url().includes("/Account/Login")) {
            const err = await this.page!
                .$eval(SEL.AUTH_ERROR, (el) => el.textContent?.trim())
                .catch(() => "Unknown error");
            throw new Error(`Login failed: ${err}`);
        }
        this.isAuthenticated = true;
        console.log("Login successful.");
    }

    // ─── Job Orchestration ────────────────────────────────────────────────────
    /**
     * FIX: termId here is the raw radio VALUE string (e.g. "1").
     * ScraperDatabaseService.createScrapeJob upserts a Term using this value
     * and returns a ScrapeJob document.
     */
    private async runScrapeJob(termId: string, termName: string, userId: string): Promise<void> {
        console.log(`Starting scrape job for "${termName}" (id: ${termId})…`);
        const job = await ScraperDatabaseService.createScrapeJob(termId, termName, userId);

        // Mark as running
        await ScrapeJob.findByIdAndUpdate(job._id, {
            status: "running",
            startedAt: new Date(),
        });

        try {
            // 1 – Navigate to ProgramSearch
            await this.navigateToProgramSearch();
            await ScrapeJob.addLog(termId, "Navigated to program search");

            // 2 – Select term (also intercepts filter AJAX calls)
            await this.selectTerm(termName);
            await ScrapeJob.addLog(termId, `Selected term: ${termName} (${termId})`);

            // 3 – Persist filter fields
            const filters = await this.extractFilterFields();
            await ScraperDatabaseService.saveFilterFields(termId, filters);
            await ScrapeJob.addLog(termId, "Filter fields saved");

            // 4 – Scrape all pages
            await ScrapeJob.addLog(termId, "Starting program scraping");
            const result = await this.scrapeWithRetry(termId, termName);
            const programs = result?.data ?? [];

            // 5 – Persist programs
            if (programs.length === 0) {
                await ScrapeJob.addLog(termId, "No programs found after all retries", "warn");
            } else {
                await ScraperDatabaseService.savePrograms(termId, programs);
                await ScrapeJob.addLog(termId, `Saved ${programs.length} programs`);
            }

            // 6 – Mark complete
            await ScraperDatabaseService.completeScrapeJob(termId, true);
            console.log(`✅ Scrape job done for "${termName}".`);
        } catch (error) {
            await ScraperDatabaseService.completeScrapeJob(
                termId,
                false,
                error instanceof Error ? error.message : "Unknown error"
            );
            throw error;
        }
    }

    // ─── Navigation helpers ───────────────────────────────────────────────────
    private async navigateToProgramSearch(): Promise<void> {
        console.log("Navigating to ProgramSearch…");
        await this.goto(PROGRAM_SEARCH_URL, "domcontentloaded");
        await this.wait(2000);
        const url = this.page!.url();
        console.log(`URL: ${url}`);

        if (!url.includes("/Manage/ProgramSearch")) {
            console.warn("Redirected away — session expired. Re-logging in…");
            this.isAuthenticated = false;
            await this.login();
            await this.goto(PROGRAM_SEARCH_URL, "domcontentloaded");
            await this.wait(2000);
            console.log(`URL after re-login: ${this.page!.url()}`);
        }

        await this.waitFor(SEL.STEPPER, 15_000);
        console.log("ProgramSearch page ready.");
    }

    // ─── Term Selection ───────────────────────────────────────────────────────
    private readTermRadios() {
        return this.page!.evaluate(() =>
            Array.from(
                document.querySelectorAll<HTMLInputElement>('input[name="radio_buttons_2"]')
            ).map((r) => ({
                value: r.value,
                text: document
                    .querySelector<HTMLElement>(`label[for="${r.id}"]`)
                    ?.textContent?.trim() ?? "",
            }))
        );
    }

    private async selectTerm(termName: string): Promise<string> {
        await this.waitFor(SEL.TERM_RADIO);

        const termId = await this.page!.evaluate((name) => {
            for (const r of document.querySelectorAll<HTMLInputElement>('input[name="radio_buttons_2"]')) {
                const label = document.querySelector<HTMLElement>(`label[for="${r.id}"]`);
                if (label?.textContent?.includes(name)) {
                    r.click();
                    return r.value;
                }
            }
            return null;
        }, termName);

        if (!termId) {
            const available = (await this.readTermRadios()).map((t) => t.text).join(", ");
            throw new Error(`Term "${termName}" not found. Available: ${available}`);
        }
        console.log(`Radio clicked: ${termName} (${termId})`);
        await this.wait(1000);

        // Intercept AJAX fired by Continue button
        const ajaxData = await this.interceptFiltersAndCards(async () => {
            await this.page!.click(SEL.CONTINUE_BTN);
            console.log("Clicked Continue — intercepting AJAX responses…");
        });

        // Best-effort stepper check (non-fatal)
        await this.page!
            .waitForFunction(
                () =>
                    document
                        .querySelectorAll('[data-kt-stepper-element="content"]')[1]
                        ?.classList.contains("current"),
                { timeout: 10_000 }
            )
            .catch(() => console.warn("Stepper step-2 class check timed out (non-fatal)"));

        // Cache for extractFilterFields()
        this._interceptedFilters = ajaxData.filters;
        this._cardsLoadedAfterTermSelect = ajaxData.cardsLoaded;

        const counts = Object.fromEntries(
            Object.entries(ajaxData.filters).map(([k, v]) => [k, (v as string[]).length])
        );
        console.log(`Intercepted filters: ${JSON.stringify(counts)}, cards loaded: ${ajaxData.cardsLoaded}`);
        await this.wait(500);
        return termId;
    }

    private async interceptFiltersAndCards(action: () => Promise<void>): Promise<{
        filters: FilterFieldsScrapingType;
        cardsLoaded: boolean;
    }> {
        const filters: FilterFieldsScrapingType = {
            universities: [], programs: [], degrees: [], languages: [], campuses: [],
        };
        let cardsLoaded = false;

        const FILTER_PATTERNS: Array<{ key: keyof FilterFieldsScrapingType; re: RegExp }> = [
            { key: "universities", re: /universit/i },
            { key: "programs", re: /program|major/i },
            { key: "degrees", re: /degree|degreec/i },
            { key: "languages", re: /lang/i },
            { key: "campuses", re: /campus/i },
        ];
        const CARDS_RE = /program|major|search|card/i;

        return new Promise((resolve) => {
            let idleTimer: ReturnType<typeof setTimeout>;
            let totalTimer: ReturnType<typeof setTimeout>;
            let pending = 0;

            const finish = () => {
                clearTimeout(idleTimer);
                clearTimeout(totalTimer);
                this.page!.off("response", onResponse);
                resolve({ filters, cardsLoaded });
            };

            const resetIdle = () => {
                clearTimeout(idleTimer);
                idleTimer = setTimeout(() => { if (pending === 0) finish(); }, 5000);
            };

            const onResponse = async (res: import("puppeteer").HTTPResponse) => {
                const type = res.request().resourceType();
                if (type !== "xhr" && type !== "fetch") return;
                const url = res.url();
                console.log(`[INTERCEPT] ${res.status()} ${url}`);
                pending++;
                try {
                    const ct = res.headers()["content-type"] ?? "";
                    if (ct.includes("json")) {
                        const json = await res.json().catch(() => null);
                        if (!json) return;
                        for (const { key, re } of FILTER_PATTERNS) {
                            if (re.test(url)) {
                                const items = extractNames(json);
                                if (items.length > 0) {
                                    filters[key] = items;
                                    console.log(`  → ${key}: ${items.length} items`);
                                }
                            }
                        }
                        if (CARDS_RE.test(url)) {
                            cardsLoaded = true;
                            console.log("  → cards/program response detected");
                        }
                    } else if (ct.includes("html") && CARDS_RE.test(url)) {
                        const html = await res.text().catch(() => "");
                        if (html.includes("col-lg-4") || html.includes("cards-container")) {
                            cardsLoaded = true;
                            console.log("  → HTML card fragment detected");
                        }
                    }
                } catch { /* non-fatal */ } finally {
                    pending--;
                    resetIdle();
                }
            };

            this.page!.on("response", onResponse);
            totalTimer = setTimeout(() => {
                console.warn("interceptFiltersAndCards: 60 s timeout");
                finish();
            }, 60_000);
            action().catch((e) => console.error("Action error:", e));
            resetIdle();
        });
    }

    // ─── Filters ──────────────────────────────────────────────────────────────
    private async extractFilterFields(): Promise<FilterFieldsScrapingType> {
        if (this._interceptedFilters) {
            const f = this._interceptedFilters;
            this._interceptedFilters = null;
            const counts = Object.fromEntries(
                Object.entries(f).map(([k, v]) => [k, (v as string[]).length])
            );
            if (Object.values(counts).some((n) => n > 0)) {
                console.log(`Using intercepted filters: ${JSON.stringify(counts)}`);
                return f;
            }
        }

        // Fallback: DOM-based extraction
        console.log("Falling back to DOM-based filter extraction…");
        const pick = async (sel: string): Promise<string[]> => {
            try {
                return await this.page!.$$eval(`${sel} option`, (opts) =>
                    opts
                        .map((o) => o.textContent?.trim() ?? "")
                        .filter((t) => t && !t.startsWith("Please Select"))
                );
            } catch { return []; }
        };

        const [universities, programs, degrees, languages, campuses] = await Promise.all([
            pick(SEL.UNIVERSITY),
            pick(SEL.PROGRAM),
            pick(SEL.DEGREE),
            pick(SEL.LANGUAGE),
            pick(SEL.CAMPUS),
        ]);

        console.log(
            `DOM filters — unis:${universities.length} progs:${programs.length} ` +
            `deg:${degrees.length} lang:${languages.length} campus:${campuses.length}`
        );
        return { universities, programs, degrees, languages, campuses };
    }

    // ─── Scrape with retry ────────────────────────────────────────────────────
    private async scrapeWithRetry(
        termId: string,
        termName: string,
        maxRetries = 3
    ): Promise<ScrapeResult | null> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const hasCards = await this.page!.evaluate(
                    () => (document.querySelector("#cards-container")?.children.length ?? 0) > 0
                );

                if (!hasCards) {
                    console.log(`Attempt ${attempt}: no cards visible — triggering search…`);
                    await this.triggerSearch();
                    await this.page!
                        .waitForFunction(
                            () =>
                                (document.querySelector("#cards-container")?.children.length ?? 0) > 0,
                            { timeout: 20_000 }
                        )
                        .catch(() => console.warn("Cards still not visible after trigger"));
                }

                const result = await this.scrapeAllPages();
                if (result.data.length > 0) {
                    console.log(`Attempt ${attempt}: ✔ ${result.data.length} programs`);
                    return result;
                }

                console.log(`Attempt ${attempt}: 0 programs found`);
                if (attempt < maxRetries) {
                    await ScrapeJob.addLog(termId, `Retry ${attempt}/${maxRetries}…`);
                    await this.wait(5000);
                    await this.navigateToProgramSearch();
                    await this.selectTerm(termName);
                }
            } catch (err) {
                console.error(`Attempt ${attempt} error:`, err);
                if (attempt === maxRetries) throw err;
                await this.wait(3000);
            }
        }
        return null;
    }

    private async triggerSearch(): Promise<void> {
        const strategy = await this.page!.evaluate(() => {
            const btn = document.querySelector<HTMLElement>("#kt_button_1");
            if (btn?.offsetParent) { btn.click(); return "clicked #kt_button_1"; }
            const sel = document.querySelector<HTMLSelectElement>("#selectuniversity");
            if (sel) {
                sel.dispatchEvent(new Event("change", { bubbles: true }));
                sel.dispatchEvent(new Event("select2:select", { bubbles: true }));
                return `change on #selectuniversity (${sel.options.length} opts)`;
            }
            return "no strategy found";
        });
        console.log(`Trigger: ${strategy}`);
        await this.wait(4000);
    }

    // ─── Page scraping ────────────────────────────────────────────────────────
    private async scrapeAllPages(): Promise<ScrapeResult> {
        const pagination = await this.getPaginationInfo();
        console.log(`Pages: ${pagination.totalPages}, total records: ${pagination.totalRecords}`);
        const all: ProgramScrapingType[] = [];

        for (let p = 1; p <= pagination.totalPages; p++) {
            if (p > 1) await this.goToPage(p);
            console.log(`Scraping page ${p}/${pagination.totalPages}…`);
            const data = await this.scrapeCurrentPage();
            console.log(`  → ${data.length} programs on page ${p}`);
            all.push(...data);
            if (p < pagination.totalPages) await this.wait(800);
        }

        console.log(`Total scraped: ${all.length}`);
        return { data: all, pagination, timestamp: new Date() };
    }

    async scrapeCurrentPage(): Promise<ProgramScrapingType[]> {
        const isEmpty = await this.page!.$(SEL.NO_DATA).then(Boolean).catch(() => false);
        if (isEmpty) return [];

        const info = await this.page!.evaluate(() => {
            const el = document.querySelector("#cards-container");
            return { found: !!el, children: el?.children.length ?? 0 };
        });
        console.log(`Container: found=${info.found}, children=${info.children}`);

        return this.page!.evaluate((sels) => {
            function findCards(): Element[] {
                for (const s of sels) {
                    const r = Array.from(document.querySelectorAll(s));
                    if (r.length) return r;
                }
                return [];
            }

            const txt = (el: Element, s: string) =>
                el.querySelector(s)?.textContent?.trim() ?? "";
            const toNum = (t: string) => {
                const m = t.match(/[\d,.]+/);
                return m ? parseFloat(m[0].replace(/,/g, "")) : 0;
            };

            return findCards().map((card) => {
                const universityName =
                    txt(card, ".plan-header h4:nth-of-type(2)") ||
                    txt(card, ".plan-header h4") ||
                    txt(card, ".university-name");
                const programName =
                    txt(card, ".plan-header h3") || txt(card, ".program-name");
                const alternativeProgramName = txt(card, ".plan-header p");

                let tuitionFeeText = "",
                    discountedFeeText = "",
                    depositText = "",
                    prepSchoolText = "",
                    campusText = "",
                    quotaText = "",
                    cashPaymentFee = "";

                card.querySelectorAll("ul li").forEach((li) => {
                    const t = li.textContent?.trim() ?? "";
                    if (t.includes("Tuition Fee") || t.includes("Tuition"))
                        tuitionFeeText = t;
                    else if (t.includes("Discounted") || t.includes("Discount"))
                        discountedFeeText = t;
                    else if (t.includes("Deposit") || t.includes("Advance"))
                        depositText = t;
                    else if (t.includes("Prep School") || t.includes("Foundation"))
                        prepSchoolText = t;
                    else if (t.includes("Campus"))
                        campusText = t;
                    else if (t.includes("Quota"))
                        quotaText = t;
                    else if (t.includes("Cash") || t.includes("Payment"))
                        cashPaymentFee = t;
                });

                const currency = discountedFeeText.match(/[A-Z]{3}/)?.[0] ?? "";
                const campus = campusText.replace(/Campus:?/i, "").trim();
                const quotaFull = quotaText.includes("Quota Full");
                const cb = card.querySelector<HTMLInputElement>("input[type='checkbox']");
                const attr = (n: string) => cb?.getAttribute(`data-${n}`) ?? "";

                return {
                    id: cb?.value ?? "",
                    programName,
                    alternativeProgramName,
                    universityName,
                    universityId: attr("university"),
                    universityLogo: attr("universityurl"),
                    programDegree: attr("degreec"),
                    language: attr("lang"),
                    campus,
                    tuitionFee: toNum(tuitionFeeText),
                    discountedTuitionFee: toNum(discountedFeeText),
                    currency,
                    depositPrice: toNum(depositText),
                    prepSchoolFee: toNum(prepSchoolText),
                    cashPaymentFee,
                    quotaFull,
                    semester: attr("semester"),
                    termSettings: attr("term"),
                    academicYear: attr("academic"),
                };
            });
        }, CARD_SELECTORS) as Promise<ProgramScrapingType[]>;
    }

    // ─── Pagination ───────────────────────────────────────────────────────────
    private async getPaginationInfo(): Promise<PaginationInfo> {
        try {
            const t = await this.page!.$eval(SEL.PAGE_INFO, (el) => el.textContent ?? "");
            console.log(`Page info text: "${t}"`);
            const pg = t.match(/Page (\d+) of (\d+)/i);
            const rec = t.match(/Total Records?:\s*(\d+)/i);
            return {
                currentPage: pg ? +pg[1]! : 1,
                totalPages: pg ? +pg[2]! : 1,
                totalRecords: rec ? +rec[1]! : 0,
                recordsPerPage: 12,
            };
        } catch {
            const n = await this.countCards();
            return { currentPage: 1, totalPages: 1, totalRecords: n, recordsPerPage: n };
        }
    }

    private async countCards(): Promise<number> {
        for (const s of CARD_SELECTORS) {
            const n = await this.page!.$$(s).then((e) => e.length).catch(() => 0);
            if (n > 0) return n;
        }
        return 0;
    }

    private async goToPage(n: number): Promise<void> {
        const clicked = await this.page!.evaluate((target) => {
            const link = Array.from(document.querySelectorAll(".pagination li a")).find(
                (a) => a.textContent?.trim() === String(target)
            ) as HTMLElement | undefined;
            if (link) { link.click(); return true; }
            const next = document.querySelector<HTMLElement>(
                ".pagination .next a, [aria-label='Next']"
            );
            if (next) { next.click(); return true; }
            return false;
        }, n);

        if (!clicked) throw new Error(`Cannot navigate to page ${n}`);
        await this.wait(2000);
        await this.page!
            .waitForFunction(
                (p) => document.querySelector("#page-info")?.textContent?.includes(`Page ${p}`),
                { timeout: 10_000 },
                n
            )
            .catch(() => { });
        await this.wait(500);
    }

    // ─── Utilities ────────────────────────────────────────────────────────────
    private async goto(
        url: string,
        waitUntil: "load" | "domcontentloaded" | "networkidle0" | "networkidle2" = "networkidle2"
    ): Promise<void> {
        await this.page!.goto(url, { waitUntil, timeout: this.timeout });
    }

    private async waitFor(selector: string, timeout = 15_000): Promise<void> {
        await this.page!.waitForSelector(selector, { timeout });
    }

    private wait(ms: number): Promise<void> {
        return new Promise((r) => setTimeout(r, ms));
    }
}