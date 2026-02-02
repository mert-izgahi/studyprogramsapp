import type { Page } from 'puppeteer';
import type {
    FilterFields,
    Program,
    ProgramSearchOptions,
    PaginationInfo,
    ScrapeResult,
} from '../types';
import { ScraperError, ScraperErrorType } from '../types';

/**
 * Service for scraping program search data
 */
export class ProgramSearchService {
    private readonly page: Page;

    private static readonly BASE_URL = 'https://partner.unitededucation.com/Manage/ProgramSearch';
    private static readonly SELECTORS = {
        STEPPER: '#kt_stepper_example_basic',
        TERM_RADIO: 'input[name="radio_buttons_2"]',
        CONTINUE_BTN: '#kt_button_1',
        RESET_BTN: '#kt_button_2',
        SEARCH_BTN: '#kt_button_1',
        FILTERS: {
            UNIVERSITY: '#selectuniversity',
            PROGRAM: '#selectprogram',
            DEGREE: '#selectdegree',
            LANGUAGE: '#selectlang',
            CAMPUS: '#selectcampus',
            MIN_PRICE: '#minp',
            MAX_PRICE: '#maxp',
        },
        CARDS_CONTAINER: '#cards-container .col-lg-4',
        CARDS_CONTAINER_ALT: '#cards-container .col-xl-3', // Alternative selector
        NO_DATA_MESSAGE: '.no-data-message',
        PAGE_INFO: '#page-info',
        PAGINATION: '.pagination',
        MODAL: '#kt_modal_1',
        MODAL_BUTTON: 'a[data-bs-target="#kt_modal_1"]',
        MODAL_CLOSE: '#close',
        TABLE_BODY: '#table-body',
        FILTER_SECTION: '#kt_stepper_example_basic .current', // Check if filters are visible
    };

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Navigate to program search page
     */
    async navigateToProgramSearch(): Promise<void> {
        try {
            console.log('Navigating to Program Search page...');

            await this.page.goto(ProgramSearchService.BASE_URL, {
                waitUntil: 'networkidle2',
                timeout: 30000,
            });

            await this.page.waitForSelector(ProgramSearchService.SELECTORS.STEPPER, {
                timeout: 15000,
            });

            console.log('Program Search page loaded successfully');
        } catch (error) {
            throw new ScraperError(
                ScraperErrorType.NAVIGATION_ERROR,
                'Failed to navigate to Program Search',
                error as Error
            );
        }
    }

    /**
     * Select term (academic period)
     */
    async selectTerm(termName: string = 'Fall 2026-2027'): Promise<string> {
        try {
            console.log(`Selecting term: ${termName}`);

            await this.page.waitForSelector(ProgramSearchService.SELECTORS.TERM_RADIO, {
                timeout: 10000,
            });

            // Find and click the term radio button based on the label text
            const termId = await this.page.evaluate((name) => {
                // Find all radio buttons with name="radio_buttons_2"
                const radioButtons = document.querySelectorAll('input[name="radio_buttons_2"]');

                for (const radio of radioButtons as any) {
                    // Get the label associated with this radio button
                    const radioId = radio.getAttribute('id');
                    if (radioId) {
                        const label = document.querySelector(`label[for="${radioId}"]`);
                        if (label && label.textContent && label.textContent.includes(name)) {
                            // Click the radio button
                            (radio as HTMLInputElement).click();
                            return (radio as HTMLInputElement).value;
                        }
                    }
                }
                return null;
            }, termName);

            if (!termId) {
                // Try alternative approach - log available terms for debugging
                const availableTerms = await this.page.evaluate(() => {
                    const radioButtons = document.querySelectorAll('input[name="radio_buttons_2"]');
                    return Array.from(radioButtons).map(radio => {
                        const radioId = radio.getAttribute('id');
                        const label = radioId ? document.querySelector(`label[for="${radioId}"]`) : null;
                        return {
                            value: (radio as HTMLInputElement).value,
                            text: label?.textContent?.trim() || '',
                        };
                    });
                });

                console.log('Available terms:', availableTerms);
                throw new Error(`Term '${termName}' not found. Available terms: ${availableTerms.map(t => t.text).join(', ')}`);
            }

            // Wait for the selection to register
            await this.wait(2000);

            // Click the continue button to proceed to next step
            const continueButton = await this.page.$(ProgramSearchService.SELECTORS.CONTINUE_BTN);
            if (continueButton) {
                await continueButton.click();
                await this.wait(5000); // Increased wait time

                // Wait for filters to load
                try {
                    await this.page.waitForSelector(ProgramSearchService.SELECTORS.FILTERS.UNIVERSITY, {
                        timeout: 10000,
                    });
                    console.log('Filters loaded successfully');
                } catch (error) {
                    console.log('Filters not immediately loaded, continuing...');
                }
            }

            console.log(`Selected term ID: ${termId}`);
            return termId;
        } catch (error) {
            throw new ScraperError(
                ScraperErrorType.SCRAPING_ERROR,
                'Failed to select term',
                error as Error
            );
        }
    }

    /**
     * Get all available filter options
     */
    async getFilterFields(): Promise<FilterFields> {
        try {
            console.log('Extracting filter fields...');

            // Wait for filters to be available
            await this.waitForFilters();

            const filterFields: FilterFields = {
                universities: await this.extractSelectOptions(ProgramSearchService.SELECTORS.FILTERS.UNIVERSITY),
                programs: await this.extractSelectOptions(ProgramSearchService.SELECTORS.FILTERS.PROGRAM),
                degrees: await this.extractSelectOptions(ProgramSearchService.SELECTORS.FILTERS.DEGREE),
                languages: await this.extractSelectOptions(ProgramSearchService.SELECTORS.FILTERS.LANGUAGE),
                campuses: await this.extractSelectOptions(ProgramSearchService.SELECTORS.FILTERS.CAMPUS),
            };

            console.log('Filter fields extracted successfully');
            console.log('Universities:', filterFields.universities.length);
            console.log('Programs:', filterFields.programs.length);
            console.log('Degrees:', filterFields.degrees.length);
            console.log('Languages:', filterFields.languages.length);
            console.log('Campuses:', filterFields.campuses.length);

            return filterFields;
        } catch (error) {
            throw new ScraperError(
                ScraperErrorType.SCRAPING_ERROR,
                'Failed to extract filter fields',
                error as Error
            );
        }
    }

    /**
     * Wait for filters to be loaded
     */
    private async waitForFilters(): Promise<void> {
        try {
            await this.page.waitForSelector(ProgramSearchService.SELECTORS.FILTERS.UNIVERSITY, {
                timeout: 10000,
            });
        } catch (error) {
            console.log('Filters not found, trying alternative approach...');
            // Try to find any filter element
            const filterSelectors = Object.values(ProgramSearchService.SELECTORS.FILTERS);
            for (const selector of filterSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 2000 });
                    return;
                } catch (e) {
                    continue;
                }
            }
            throw error;
        }
    }

    /**
     * Extract options from a select element
     */
    private async extractSelectOptions(selector: string): Promise<string[]> {
        try {
            return await this.page.$$eval(`${selector} option`, (options) =>
                options
                    .map((opt) => opt.textContent?.trim() || '')
                    .filter((text) => text && !text.includes('Please Select'))
            );
        } catch (error) {
            console.log(`Error extracting options from ${selector}:`, error);
            return [];
        }
    }

    /**
     * Apply search filters
     */
    async applyFilters(options: ProgramSearchOptions): Promise<void> {
        try {
            console.log('Applying filters...', options);

            // Wait for filters to be ready
            await this.waitForFilters();

            const filterMap: Record<string, string> = {
                university: ProgramSearchService.SELECTORS.FILTERS.UNIVERSITY,
                program: ProgramSearchService.SELECTORS.FILTERS.PROGRAM,
                degree: ProgramSearchService.SELECTORS.FILTERS.DEGREE,
                language: ProgramSearchService.SELECTORS.FILTERS.LANGUAGE,
                campus: ProgramSearchService.SELECTORS.FILTERS.CAMPUS,
            };

            // Apply dropdown filters
            for (const [key, selector] of Object.entries(filterMap)) {
                const value = options[key as keyof ProgramSearchOptions];
                if (value && typeof value === 'string') {
                    console.log(`Setting ${key} to: ${value}`);
                    await this.page.select(selector, value);
                    await this.wait(1500); // Wait for potential AJAX updates
                }
            }

            // Apply price filters
            if (options.minPrice !== undefined) {
                console.log(`Setting min price to: ${options.minPrice}`);
                await this.page.type(ProgramSearchService.SELECTORS.FILTERS.MIN_PRICE, options.minPrice.toString());
            }

            if (options.maxPrice !== undefined) {
                console.log(`Setting max price to: ${options.maxPrice}`);
                await this.page.type(ProgramSearchService.SELECTORS.FILTERS.MAX_PRICE, options.maxPrice.toString());
            }

            // Trigger search if needed
            await this.triggerSearch();

            await this.wait(3000);
            console.log('Filters applied successfully');
        } catch (error) {
            throw new ScraperError(
                ScraperErrorType.SCRAPING_ERROR,
                'Failed to apply filters',
                error as Error
            );
        }
    }

    /**
     * Trigger search button click
     */
    private async triggerSearch(): Promise<void> {
        try {
            // Look for search/apply button
            const searchBtn = await this.page.$(ProgramSearchService.SELECTORS.SEARCH_BTN);
            if (searchBtn) {
                console.log('Clicking search button...');
                await searchBtn.click();
                await this.wait(3000);
            } else {
                console.log('No search button found, trying form submission...');
                // Try to trigger search by changing focus
                await this.page.keyboard.press('Enter');
                await this.wait(2000);
            }
        } catch (error) {
            console.log('Error triggering search:', error);
        }
    }

    /**
     * Get pagination information
     */
    async getPaginationInfo(): Promise<PaginationInfo> {
        try {
            const pageInfoText = await this.page.$eval(
                ProgramSearchService.SELECTORS.PAGE_INFO,
                (el) => el.textContent || ''
            );

            console.log('Page info text:', pageInfoText);

            const pageMatch = pageInfoText.match(/Page (\d+) of (\d+)/);
            const recordsMatch = pageInfoText.match(/Total Records: (\d+)/);

            return {
                currentPage: pageMatch ? parseInt(pageMatch[1]!, 10) : 1,
                totalPages: pageMatch ? parseInt(pageMatch[2]!, 10) : 1,
                totalRecords: recordsMatch ? parseInt(recordsMatch[1]!, 10) : 0,
                recordsPerPage: 12, // Default, could be calculated
            };
        } catch {
            // Fallback if page info not available
            const cards = await this.getProgramCards();
            return {
                currentPage: 1,
                totalPages: 1,
                totalRecords: cards.length,
                recordsPerPage: cards.length,
            };
        }
    }

    /**
     * Get program cards elements
     */
    private async getProgramCards(): Promise<any[]> {
        // Try multiple selectors for program cards
        const selectors = [
            ProgramSearchService.SELECTORS.CARDS_CONTAINER,
            ProgramSearchService.SELECTORS.CARDS_CONTAINER_ALT,
            '#cards-container .col-md-4',
            '#cards-container .card',
            '.program-card',
        ];

        for (const selector of selectors) {
            try {
                const cards = await this.page.$$(selector);
                if (cards.length > 0) {
                    console.log(`Found ${cards.length} cards with selector: ${selector}`);
                    return cards;
                }
            } catch (error) {
                continue;
            }
        }

        console.log('No program cards found with any selector');
        return [];
    }

    /**
     * Check if no data message is displayed
     */
    private async hasNoDataMessage(): Promise<boolean> {
        try {
            const noDataEl = await this.page.$(ProgramSearchService.SELECTORS.NO_DATA_MESSAGE);
            return noDataEl !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Scrape programs from current page
     */
    /**
 * Scrape programs from current page
 */
    async scrapeCurrentPage(): Promise<Program[]> {
        try {
            console.log('Scraping programs from current page...');

            // Check for no data message
            if (await this.hasNoDataMessage()) {
                console.log('No data message displayed, returning empty array');
                return [];
            }

            // Try multiple selectors for program cards
            const programs = await this.page.evaluate(() => {
                // Function to find program cards
                function findProgramCards(): Element[] {
                    const selectors = [
                        '#cards-container .col-lg-4',
                        '#cards-container .col-xl-3',
                        '#cards-container .col-md-4',
                        '#cards-container .card',
                        '.program-card',
                    ];

                    for (const selector of selectors) {
                        const cards = Array.from(document.querySelectorAll(selector));
                        if (cards.length > 0) {
                            console.log(`Found ${cards.length} cards with selector: ${selector}`);
                            return cards;
                        }
                    }
                    return [];
                }

                const cards = findProgramCards();

                const getText = (card: Element, selector: string): string => {
                    const el = card.querySelector(selector);
                    return el?.textContent?.trim() || '';
                };

                const getAttribute = (card: Element, selector: string, attr: string): string => {
                    const el = card.querySelector(selector);
                    return el?.getAttribute(attr)?.trim() || '';
                };

                const getNumericValue = (text: string): number => {
                    const match = text?.match(/[\d,.]+/);
                    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
                };

                return cards.map((card) => {
                    // Try different selectors for university logo
                    const universityLogo =
                        getAttribute(card, '.plan-header img', 'src') ||
                        getAttribute(card, '.plan-header .plan-price img', 'src') ||
                        getAttribute(card, '.card-header img', 'src') ||
                        getAttribute(card, '.university-logo img', 'src') ||
                        '';

                    // Try different selectors for university name
                    const universityName =
                        getText(card, '.plan-header h4:nth-of-type(2)') ||
                        getText(card, '.plan-header h4:not(:first-of-type)') ||
                        getText(card, '.plan-header h4') ||
                        getText(card, '.card-header h4') ||
                        getText(card, '.university-name') ||
                        '';

                    // Try different selectors for program name
                    const programName =
                        getText(card, '.plan-header h3') ||
                        getText(card, '.card-title h3') ||
                        getText(card, '.program-name') ||
                        '';

                    const alternativeProgramName = getText(card, '.plan-header p') || '';

                    // Try to find all list items
                    const listItems = Array.from(card.querySelectorAll('ul li'));

                    // Extract information from list items
                    let tuitionFeeText = '';
                    let discountedFeeText = '';
                    let depositText = '';
                    let prepSchoolText = '';
                    let campusText = '';
                    let quotaText = '';
                    let cashPaymentFee = '';

                    listItems.forEach((li, index) => {
                        const text = li.textContent?.trim() || '';
                        if (text.includes('Tuition Fee') || text.includes('Tuition')) {
                            tuitionFeeText = text;
                        } else if (text.includes('Discounted') || text.includes('Discount')) {
                            discountedFeeText = text;
                        } else if (text.includes('Deposit') || text.includes('Advance')) {
                            depositText = text;
                        } else if (text.includes('Prep School') || text.includes('Foundation')) {
                            prepSchoolText = text;
                        } else if (text.includes('Campus')) {
                            campusText = text;
                        } else if (text.includes('Quota')) {
                            quotaText = text;
                        } else if (text.includes('Cash') || text.includes('Payment')) {
                            cashPaymentFee = text;
                        }
                    });

                    const currencyMatch = discountedFeeText?.match(/[A-Z]{3}/);
                    const currency = currencyMatch ? currencyMatch[0] : '';

                    const campus = campusText?.replace('Campus: ', '') || '';
                    const quotaFull = quotaText?.includes('Quota Full') || false;

                    // Try to find checkbox
                    const checkbox = card.querySelector('input[type="checkbox"]');
                    const getDataAttr = (attr: string) =>
                        checkbox?.getAttribute(`data-${attr}`) || '';

                    return {
                        id: (checkbox as HTMLInputElement)?.value || '',
                        programName,
                        alternativeProgramName,
                        universityName,
                        universityLogo, // Added university logo
                        universityId: getDataAttr('university'),
                        programDegree: getDataAttr('degreec'),
                        language: getDataAttr('lang'),
                        campus,
                        tuitionFee: getNumericValue(tuitionFeeText),
                        discountedTuitionFee: getNumericValue(discountedFeeText),
                        currency,
                        depositPrice: getNumericValue(depositText),
                        prepSchoolFee: getNumericValue(prepSchoolText),
                        cashPaymentFee,
                        quotaFull,
                        semester: getDataAttr('semester'),
                        termSettings: getDataAttr('term'),
                        academicYear: getDataAttr('academic'),
                    };
                });
            });

            console.log(`Scraped ${programs.length} programs from current page`);

            // Log first program for debugging
            if (programs.length > 0) {
                console.log('First program sample:', JSON.stringify(programs[0], null, 2));
            }

            return programs as Program[];
        } catch (error) {
            console.error('Error scraping current page:', error);
            // Take screenshot for debugging
            await this.takeScreenshot(`error-scraping-${Date.now()}.png`);
            throw new ScraperError(
                ScraperErrorType.SCRAPING_ERROR,
                'Failed to scrape programs',
                error as Error
            );
        }
    }

    /**
     * Scrape all programs across all pages
     */
    async scrapeAllPrograms(options?: ProgramSearchOptions): Promise<ScrapeResult> {
        try {
            console.log('Starting to scrape all programs...');

            if (options) {
                await this.applyFilters(options);
            } else {
                // If no filters applied, trigger search to load initial programs
                await this.triggerSearch();
                await this.wait(3000);
            }

            const pagination = await this.getPaginationInfo();
            console.log(`Pagination info:`, pagination);
            console.log(`Total pages to scrape: ${pagination.totalPages}`);

            const allPrograms: Program[] = [];

            for (let page = 1; page <= pagination.totalPages; page++) {
                if (page > 1) {
                    await this.goToPage(page);
                }

                console.log(`Scraping page ${page}/${pagination.totalPages}...`);
                const pagePrograms = await this.scrapeCurrentPage();
                allPrograms.push(...pagePrograms);

                if (page < pagination.totalPages) {
                    await this.wait(1000);
                }
            }

            console.log(`Total programs scraped: ${allPrograms.length}`);

            return {
                data: allPrograms,
                pagination,
                timestamp: new Date(),
                filters: options,
            };
        } catch (error) {
            throw new ScraperError(
                ScraperErrorType.SCRAPING_ERROR,
                'Failed to scrape all programs',
                error as Error
            );
        }
    }

    /**
     * Navigate to specific page
     */
    async goToPage(pageNumber: number): Promise<void> {
        try {
            const pagination = await this.getPaginationInfo();

            if (pagination.currentPage === pageNumber) {
                console.log(`Already on page ${pageNumber}`);
                return;
            }

            console.log(`Attempting to navigate from page ${pagination.currentPage} to page ${pageNumber}`);

            // Strategy 1: Try clicking directly using page.evaluate (most reliable)
            const clicked = await this.page.evaluate((targetPage) => {
                // Try finding by exact page number text first
                const links = Array.from(document.querySelectorAll('.pagination li a'));
                const targetLink = links.find((link) => {
                    const text = link.textContent?.trim();
                    return text === targetPage.toString();
                });

                if (targetLink && targetLink instanceof HTMLElement) {
                    targetLink.click();
                    return true;
                }

                // Try next button if moving forward
                const nextBtn = document.querySelector('.pagination .next a, .pagination li.next a, [aria-label="Next"]');
                if (nextBtn && nextBtn instanceof HTMLElement) {
                    nextBtn.click();
                    return true;
                }

                return false;
            }, pageNumber);

            if (clicked) {
                // Wait for page to load
                await this.wait(2000);
                // Wait for content to update
                await this.page.waitForFunction(
                    (expectedPage) => {
                        const pageInfo = document.querySelector('#page-info');
                        return pageInfo?.textContent?.includes(`Page ${expectedPage}`);
                    },
                    { timeout: 10000 },
                    pageNumber
                ).catch(() => {
                    console.log('Page info did not update, continuing anyway...');
                });
                await this.wait(1000);
                console.log(`Successfully navigated to page ${pageNumber}`);
                return;
            }

            // Strategy 2: Use sequential next button clicking for nearby pages
            const currentPage = pagination.currentPage;
            if (pageNumber > currentPage && pageNumber - currentPage <= 3) {
                console.log('Using next button navigation...');
                for (let i = currentPage; i < pageNumber; i++) {
                    const success = await this.page.evaluate(() => {
                        const selectors = [
                            '.pagination .next a',
                            '.pagination li.next a',
                            'a[aria-label="Next"]',
                            '.pagination a[rel="next"]',
                        ];

                        for (const selector of selectors) {
                            const btn = document.querySelector(selector);
                            if (btn && btn instanceof HTMLElement) {
                                btn.click();
                                return true;
                            }
                        }
                        return false;
                    });

                    if (!success) {
                        throw new Error('Next button not found');
                    }

                    await this.wait(2000);
                }
                console.log(`Successfully navigated to page ${pageNumber} using next button`);
                return;
            }

            throw new Error('Could not find pagination controls');
        } catch (error) {
            console.error(`Error navigating to page ${pageNumber}:`, error);
            // Take screenshot for debugging
            await this.takeScreenshot(`pagination-error-page-${pageNumber}.png`);
            throw new ScraperError(
                ScraperErrorType.NAVIGATION_ERROR,
                `Failed to navigate to page ${pageNumber}`,
                error as Error
            );
        }
    }

    /**
     * Reset all filters
     */
    async resetFilters(): Promise<void> {
        try {
            console.log('Resetting filters...');
            const resetButton = await this.page.$(ProgramSearchService.SELECTORS.RESET_BTN);
            if (resetButton) {
                await resetButton.click();
                await this.wait(3000);
                console.log('Filters reset successfully');
            }
        } catch (error) {
            throw new ScraperError(
                ScraperErrorType.SCRAPING_ERROR,
                'Failed to reset filters',
                error as Error
            );
        }
    }

    /**
     * Take screenshot for debugging
     */
    async takeScreenshot(path: string = `debug-${Date.now()}.png`): Promise<void> {
        try {
            await this.page.screenshot({ path, fullPage: true });
            console.log(`Debug screenshot saved to: ${path}`);
        } catch (error) {
            console.error('Failed to take screenshot:', error);
        }
    }

    /**
     * Utility wait method
     */
    private async wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}