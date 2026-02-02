import { AuthenticationService } from './core/Authentication';
import { ProgramSearchService } from './services/ProgramSearchService';
import type {
    LoginCredentials,
    LoginOptions,
    ProgramSearchOptions,
    ScrapeResult,
    FilterFields,
    Program,
} from './types';

/**
 * Main scraper class that orchestrates authentication and data scraping
 */
export class UnitedEducationScraper {
    private authService: AuthenticationService;
    private programSearchService: ProgramSearchService | null = null;

    constructor(credentials: LoginCredentials, options: LoginOptions = {}) {
        this.authService = new AuthenticationService(credentials, options);
    }

    /**
     * Initialize the scraper
     */
    async initialize(): Promise<void> {
        await this.authService.initialize();
    }

    /**
     * Login to the platform
     */
    async login(): Promise<boolean> {
        const success = await this.authService.login();

        if (success) {
            // Initialize program search service with the authenticated page
            this.programSearchService = new ProgramSearchService(this.authService.getPage());
        }

        return success;
    }

    /**
     * Navigate to program search and select term
     */
    async setupProgramSearch(termName?: string): Promise<string> {
        this.ensureProgramSearchService();

        await this.programSearchService!.navigateToProgramSearch();
        const termId = await this.programSearchService!.selectTerm(termName);

        return termId;
    }

    /**
     * Get available filter options
     */
    async getAvailableFilters(): Promise<FilterFields> {
        this.ensureProgramSearchService();
        return this.programSearchService!.getFilterFields();
    }

    /**
     * Scrape programs with optional filters
     */
    async scrapePrograms(options?: ProgramSearchOptions): Promise<ScrapeResult> {
        this.ensureProgramSearchService();
        return this.programSearchService!.scrapeAllPrograms(options);
    }

    /**
     * Scrape current page only
     */
    async scrapeCurrentPage(): Promise<Program[]> {
        this.ensureProgramSearchService();
        return this.programSearchService!.scrapeCurrentPage();
    }

    /**
     * Apply filters without scraping
     */
    async applyFilters(options: ProgramSearchOptions): Promise<void> {
        this.ensureProgramSearchService();
        await this.programSearchService!.applyFilters(options);
    }

    /**
     * Reset filters
     */
    async resetFilters(): Promise<void> {
        this.ensureProgramSearchService();
        await this.programSearchService!.resetFilters();
    }

    /**
     * Take screenshot
     */
    async takeScreenshot(path?: string): Promise<void> {
        if (this.programSearchService) {
            await this.programSearchService.takeScreenshot(path);
        } else {
            await this.authService.takeScreenshot(path);
        }
    }

    /**
     * Get cookies for session persistence
     */
    async getCookies(): Promise<any[]> {
        return this.authService.getCookies();
    }

    /**
     * Close the scraper and browser
     */
    async close(): Promise<void> {
        await this.authService.close();
    }

    /**
     * Ensure program search service is initialized
     */
    private ensureProgramSearchService(): void {
        if (!this.programSearchService) {
            throw new Error('Program search service not initialized. Login first.');
        }
    }
}

export * from './types';