import puppeteer, { Browser, Page } from 'puppeteer';
import type { BrowserConfig } from '../types';
import { ScraperError, ScraperErrorType } from '../types';

/**
 * Base class for managing Puppeteer browser lifecycle
 * Provides common browser operations and error handling
 */
export abstract class BrowserManager {
    protected browser: Browser | null = null;
    protected page: Page | null = null;
    protected readonly config: Required<BrowserConfig>;

    private static readonly DEFAULT_CONFIG: Required<BrowserConfig> = {
        headless: true,
        slowMo: 0,
        timeout: 30000,
        viewport: { width: 1366, height: 768 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    constructor(config: BrowserConfig = {}) {
        this.config = { ...BrowserManager.DEFAULT_CONFIG, ...config };
    }

    /**
     * Initialize browser and create new page
     */
    async initialize(): Promise<void> {
        try {
            if (this.browser) {
                console.log('Browser already initialized');
                return;
            }

            console.log('Initializing browser...');

            this.browser = await puppeteer.launch({
                headless: this.config.headless,
                slowMo: this.config.slowMo,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                ],
            });

            this.page = await this.browser.newPage();

            // Set viewport
            await this.page.setViewport(this.config.viewport);

            // Set user agent
            await this.page.setUserAgent(this.config.userAgent);

            // Add extra headers to avoid detection
            await this.page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
            });

            console.log('Browser initialized successfully');
        } catch (error) {
            throw new ScraperError(
                ScraperErrorType.INITIALIZATION_ERROR,
                'Failed to initialize browser',
                error as Error
            );
        }
    }

    /**
     * Navigate to a URL with error handling
     */
    protected async navigateTo(
        url: string,
        options: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' } = {}
    ): Promise<void> {
        this.ensureInitialized();

        try {
            console.log(`Navigating to: ${url}`);
            await this.page!.goto(url, {
                waitUntil: options.waitUntil || 'networkidle2',
                timeout: this.config.timeout,
            });
        } catch (error) {
            throw new ScraperError(
                ScraperErrorType.NAVIGATION_ERROR,
                `Failed to navigate to ${url}`,
                error as Error
            );
        }
    }

    /**
     * Wait for selector with custom timeout
     */
    protected async waitForSelector(
        selector: string,
        options: { timeout?: number; visible?: boolean } = {}
    ): Promise<void> {
        this.ensureInitialized();

        try {
            await this.page!.waitForSelector(selector, {
                timeout: options.timeout || this.config.timeout,
                visible: options.visible,
            });
        } catch (error) {
            throw new ScraperError(
                ScraperErrorType.ELEMENT_NOT_FOUND,
                `Element not found: ${selector}`,
                error as Error
            );
        }
    }

    /**
     * Take a screenshot
     */
    async takeScreenshot(path: string = 'screenshot.png', fullPage: boolean = true): Promise<void> {
        this.ensureInitialized();

        try {
            await this.page!.screenshot({ path, fullPage });
            console.log(`Screenshot saved to: ${path}`);
        } catch (error) {
            throw new ScraperError(
                ScraperErrorType.SCRAPING_ERROR,
                'Failed to take screenshot',
                error as Error
            );
        }
    }

    /**
     * Get current cookies
     */
    async getCookies(): Promise<any[]> {
        this.ensureInitialized();

        try {
            return await this.page!.cookies();
        } catch (error) {
            throw new ScraperError(
                ScraperErrorType.SCRAPING_ERROR,
                'Failed to get cookies',
                error as Error
            );
        }
    }

    /**
     * Set cookies
     */
    async setCookies(cookies: any[]): Promise<void> {
        this.ensureInitialized();

        try {
            await this.page!.setCookie(...cookies);
        } catch (error) {
            throw new ScraperError(
                ScraperErrorType.SCRAPING_ERROR,
                'Failed to set cookies',
                error as Error
            );
        }
    }

    /**
     * Close browser
     */
    async close(): Promise<void> {
        try {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
                this.page = null;
                console.log('Browser closed successfully');
            }
        } catch (error) {
            console.error('Error closing browser:', error);
        }
    }

    /**
     * Get page instance
     */
    getPage(): Page {
        this.ensureInitialized();
        return this.page!;
    }

    /**
     * Get browser instance
     */
    getBrowser(): Browser {
        this.ensureInitialized();
        return this.browser!;
    }

    /**
     * Ensure browser is initialized
     */
    protected ensureInitialized(): void {
        if (!this.browser || !this.page) {
            throw new ScraperError(
                ScraperErrorType.INITIALIZATION_ERROR,
                'Browser not initialized. Call initialize() first.'
            );
        }
    }

    /**
     * Wait for a specific amount of time
     */
    protected async wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}