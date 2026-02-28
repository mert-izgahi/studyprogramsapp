// scripts/test-scraper.ts
// Run with: npx tsx scripts/test-scraper.ts
import "dotenv/config";
import dbConnect from "@/lib/mongoose";
import { Scraper } from "@/scraper/Scraper";

// ─── ANSI colours for readable output ────────────────────────────────────────
const c = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
};

function log(label: string, msg: string, colour = c.cyan) {
    const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
    console.log(`${c.gray}[${ts}]${c.reset} ${colour}${c.bold}${label}${c.reset} ${msg}`);
}
function ok(msg: string) { log("✔ PASS", msg, c.green); }
function fail(msg: string) { log("✘ FAIL", msg, c.red); }
function info(msg: string) { log("ℹ INFO", msg, c.cyan); }
function warn(msg: string) { log("⚠ WARN", msg, c.yellow); }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function assert(condition: boolean, message: string) {
    if (condition) { ok(message); }
    else { fail(message); throw new Error(`Assertion failed: ${message}`); }
}

function printSection(title: string) {
    console.log(`\n${c.bold}${"─".repeat(60)}${c.reset}`);
    console.log(`${c.bold}  ${title}${c.reset}`);
    console.log(`${c.bold}${"─".repeat(60)}${c.reset}\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    const scraper = new Scraper();
    let passed = 0;
    let failed = 0;

    async function run(name: string, fn: () => Promise<void>) {
        try {
            await fn();
            passed++;
        } catch (err) {
            failed++;
            console.error(`  ${c.red}Error:${c.reset}`, err instanceof Error ? err.message : err);
        }
    }

    try {
        // ── 0. Database ──────────────────────────────────────────────────────
        printSection("0 · Database connection");
        await run("DB connects", async () => {
            await dbConnect();
            ok("MongoDB connected");
        });

        // ── 1. Scraper status ────────────────────────────────────────────────
        printSection("1 · Initial scraper status");
        await run("Status before init", async () => {
            const status = scraper.getStatus();
            info(`Status: ${JSON.stringify(status)}`);
            assert(!status.isAuthenticated, "Not authenticated before first call");
            assert(!status.isScraping, "Not scraping before first call");
            assert(!status.browserOpen, "Browser not open before first call");
        });

        // ── 2. Available terms ───────────────────────────────────────────────
        printSection("2 · Get available terms (triggers login)");
        let terms: { value: string; text: string }[] = [];

        await run("Fetch terms from website", async () => {
            info("Calling getAvailableTerms() — will launch browser & log in…");
            const start = Date.now();
            terms = await scraper.getAvailableTerms();
            info(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);

            assert(Array.isArray(terms), "Returns an array");
            assert(terms.length > 0, "At least one term found");

            console.log("\n  Available terms:");
            terms.forEach((t, i) =>
                console.log(`    ${c.yellow}${i + 1}.${c.reset} ${t.text}  ${c.gray}(${t.value})${c.reset}`)
            );
        });

        // ── 3. Status after login ────────────────────────────────────────────
        printSection("3 · Scraper status after login");
        await run("Status after init", async () => {
            const status = scraper.getStatus();
            info(`Status: ${JSON.stringify(status)}`);
            assert(status.isAuthenticated, "Authenticated after getAvailableTerms()");
            assert(status.browserOpen, "Browser is open");
        });

        // ── 4. Reuse browser (second terms call should be fast) ──────────────
        printSection("4 · Browser reuse");
        await run("Second getAvailableTerms() reuses browser", async () => {
            const start = Date.now();
            const terms2 = await scraper.getAvailableTerms();
            const elapsed = Date.now() - start;
            info(`Second call took ${elapsed}ms`);
            assert(terms2.length === terms.length, "Same number of terms returned");
            assert(elapsed < 15_000, "Completed in under 15 s (no re-login)");
        });

        // ── 5. Invalid term guard ────────────────────────────────────────────
        printSection("5 · Invalid term guard");
        await run("scrapeTerm() rejects unknown termId", async () => {
            let threw = false;
            try {
                await scraper.scrapeTerm("INVALID_TERM_ID_XYZ");
            } catch (e) {
                threw = true;
                info(`Correctly threw: ${(e as Error).message}`);
            }
            assert(threw, "Throws for unknown termId");
        });

        // ── 6. Concurrent ensureReady guard ─────────────────────────────────
        printSection("6 · Concurrency guard");
        await run("Concurrent calls do not create two browsers", async () => {
            const [t1, t2] = await Promise.all([
                scraper.getAvailableTerms(),
                scraper.getAvailableTerms(),
            ]);
            assert(t1.length === t2.length, "Both concurrent calls succeeded");
            const { browserOpen } = scraper.getStatus();
            assert(browserOpen, "Still one browser instance");
        });

        // ── 7. Optional: scrape first term ───────────────────────────────────
        //
        // Uncomment the block below to actually scrape the first term.
        // This will launch a full scrape job and save programs to MongoDB.
        // It can take several minutes depending on the number of pages.
        //
        // printSection("7 · Full scrape (first term)");
        // if (terms.length > 0) {
        //     const target = terms[0]!;
        //     await run(`Scrape term: ${target.text}`, async () => {
        //         info(`Scraping term ID: ${target.value}`);
        //         const start = Date.now();
        //         await scraper.scrapeTerm(target.value, "test-script");
        //         info(`Scrape completed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
        //         ok(`Term "${target.text}" scraped and saved to MongoDB`);
        //     });
        // } else {
        //     warn("No terms available — skipping full scrape test");
        // }

    } finally {
        // ── Cleanup ──────────────────────────────────────────────────────────
        printSection("Cleanup");
        info("Closing browser…");
        await scraper.destroy().catch((e) => warn(`destroy() error: ${e.message}`));
        ok("Browser closed");

        // ── Summary ──────────────────────────────────────────────────────────
        printSection("Summary");
        console.log(
            `  ${c.green}${c.bold}Passed: ${passed}${c.reset}   ` +
            `${failed > 0 ? c.red + c.bold : c.gray}Failed: ${failed}${c.reset}\n`
        );

        process.exit(failed > 0 ? 1 : 0);
    }
}

main().catch((err) => {
    console.error(`\n${c.red}${c.bold}Unhandled error:${c.reset}`, err);
    process.exit(1);
});