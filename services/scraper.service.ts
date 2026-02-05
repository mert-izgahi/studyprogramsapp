import { UnitedEducationScraper } from "@/scraper";
import dbConnect from "@/lib/mongoose";
import { Term } from "@/models/Term";
import { Program } from "@/models/Program";
import { FilterFields } from "@/models/FilterFields";
import { ScrapeJob, IScrapeJob } from "@/models/ScrapeJob";
import type {
    LoginCredentials,
    ProgramSearchOptions,
    ScrapeResult,
} from "@/scraper/types";

export class ScraperService {
    private scraper: UnitedEducationScraper | null = null;
    private jobId: string | null = null;
    private credentials: LoginCredentials | null = null;

    /**
     * Initialize the scraper with credentials
     */
    async initialize(credentials: LoginCredentials): Promise<void> {
        // Store credentials for potential re-initialization
        this.credentials = credentials;

        this.scraper = new UnitedEducationScraper(credentials, {
            headless: true,
            timeout: 60000,
        });

        await this.scraper.initialize();
        const loginSuccess = await this.scraper.login();

        if (!loginSuccess) {
            throw new Error("Login failed. Please check your credentials.");
        }

        console.log("Scraper initialized and logged in successfully");
    }

    /**
     * Scrape and save all available terms to database
     */
    async scrapeAndSaveTerms(userId: string): Promise<string> {
        if (!this.scraper) {
            throw new Error("Scraper not initialized. Call initialize() first.");
        }

        await dbConnect();

        try {
            // Create job for term scraping
            const job = await ScrapeJob.create({
                termId: "N/A",
                termName: "All Terms",
                status: "pending",
                initiatedBy: userId,
                logs: ["Starting to scrape available terms..."],
            });

            this.jobId = job._id.toString();

            await this.updateJobStatus(
                this.jobId,
                "running",
                "Navigating to program search..."
            );

            // Get available terms directly
            await this.updateJobLogs(this.jobId, "Fetching available terms...");
            
            const availableTerms = await this.scraper.getAvailableTerms();

            if (availableTerms.length === 0) {
                throw new Error("No terms found on the platform");
            }

            await this.updateJobLogs(
                this.jobId,
                `Found ${availableTerms.length} terms. Saving to database...`
            );

            // Save terms to database
            const savedTerms = await this.saveTermsToDatabase(availableTerms);

            await this.updateJobStatus(
                this.jobId,
                "completed",
                `Successfully scraped and saved ${savedTerms.length} terms`
            );

            return this.jobId;
        } catch (error) {
            if (this.jobId) {
                await this.updateJobStatus(
                    this.jobId,
                    "failed",
                    `Error: ${(error as Error).message}`
                );
            }
            throw error;
        } finally {
            await this.cleanup();
        }
    }

    /**
     * Save terms to database
     */
    private async saveTermsToDatabase(
        terms: { value: string; text: string }[]
    ): Promise<any[]> {
        await dbConnect();

        const savedTerms = [];

        for (const term of terms) {
            const academicYear = term.text.match(/\d{4}-\d{4}/)?.[0] || "";

            const savedTerm = await Term.findOneAndUpdate(
                { termId: term.value },
                {
                    termId: term.value,
                    name: term.text,
                    academicYear,
                    isActive: true,
                    isScraped: false,
                },
                { upsert: true, new: true }
            );

            savedTerms.push(savedTerm);
        }

        return savedTerms;
    }

    /**
     * Start scraping programs for a specific term (using termId from database)
     */
    async startScrapingForTerm(
        termId: string,
        userId: string,
        options?: ProgramSearchOptions
    ): Promise<string> {
        if (!this.scraper) {
            throw new Error("Scraper not initialized. Call initialize() first.");
        }

        await dbConnect();

        try {
            // Find the term in database
            const term = await Term.findByTermId(termId);

            if (!term) {
                throw new Error(`Term with ID ${termId} not found in database`);
            }

            // Create scrape job
            const job = await ScrapeJob.create({
                termId: term.termId,
                termName: term.name,
                status: "pending",
                initiatedBy: userId,
                logs: [`Scraping started for term: ${term.name}`],
            });

            this.jobId = job._id.toString();

            await this.updateJobStatus(
                this.jobId,
                "running",
                "Setting up program search..."
            );

            // Setup program search with the term name
            await this.scraper.setupProgramSearch(term.name);

            await this.updateJobLogs(this.jobId, "Fetching filter fields...");

            // Get and save filter fields
            const filterFields = await this.scraper.getAvailableFilters();
            await this.saveFilterFields(term.termId, filterFields);
            await this.updateJobLogs(this.jobId, "Filter fields saved successfully");

            // Start program scraping
            await this.updateJobLogs(this.jobId, "Starting program scraping...");
            const result = await this.scraper.scrapePrograms(options);

            // Save programs to database
            await this.savePrograms(term.termId, result);

            // Mark term as scraped
            await Term.markAsScraped(term.termId, result.data.length);

            await this.updateJobStatus(
                this.jobId,
                "completed",
                `Successfully scraped ${result.data.length} programs for ${term.name}`
            );

            return this.jobId;
        } catch (error) {
            if (this.jobId) {
                await this.updateJobStatus(
                    this.jobId,
                    "failed",
                    `Error: ${(error as Error).message}`
                );
            }
            throw error;
        } finally {
            await this.cleanup();
        }
    }

    /**
     * Start scraping programs for a term by name (backward compatibility)
     */
    async startScrapingForTermByName(
        termName: string,
        userId: string,
        options?: ProgramSearchOptions
    ): Promise<string> {
        if (!this.scraper) {
            throw new Error("Scraper not initialized. Call initialize() first.");
        }

        await dbConnect();

        try {
            // Setup program search and get term ID
            const scrapedTermId = await this.scraper.setupProgramSearch(termName);

            // Create or update term in database
            const academicYear = termName.match(/\d{4}-\d{4}/)?.[0] || "";
            await Term.findOneAndUpdate(
                { termId: scrapedTermId },
                {
                    termId: scrapedTermId,
                    name: termName,
                    academicYear,
                    isActive: true,
                },
                { upsert: true, new: true }
            );

            // Create scrape job
            const job = await ScrapeJob.create({
                termId: scrapedTermId,
                termName,
                status: "pending",
                initiatedBy: userId,
                logs: [`Scraping started for term: ${termName}`],
            });

            this.jobId = job._id.toString();

            await this.updateJobStatus(
                this.jobId,
                "running",
                "Fetching filter fields..."
            );

            const filterFields = await this.scraper.getAvailableFilters();
            await this.saveFilterFields(scrapedTermId, filterFields);
            await this.updateJobLogs(this.jobId, "Filter fields saved successfully");

            await this.updateJobLogs(this.jobId, "Starting program scraping...");
            const result = await this.scraper.scrapePrograms(options);

            await this.savePrograms(scrapedTermId, result);

            // Mark term as scraped
            await Term.markAsScraped(scrapedTermId, result.data.length);

            await this.updateJobStatus(
                this.jobId,
                "completed",
                `Successfully scraped ${result.data.length} programs`
            );

            return this.jobId;
        } catch (error) {
            if (this.jobId) {
                await this.updateJobStatus(
                    this.jobId,
                    "failed",
                    `Error: ${(error as Error).message}`
                );
            }
            throw error;
        } finally {
            await this.cleanup();
        }
    }

    /**
     * Scrape all unscraped terms
     */
    async scrapeAllUnscrapedTerms(
        userId: string,
        options?: ProgramSearchOptions
    ): Promise<string[]> {
        await dbConnect();

        const unscrapedTerms = await Term.find({ isScraped: false }).sort({
            createdAt: -1,
        });

        if (unscrapedTerms.length === 0) {
            throw new Error("No unscraped terms found");
        }

        const jobIds: string[] = [];

        for (const term of unscrapedTerms) {
            try {
                // Re-initialize scraper for each term
                if (!this.credentials) {
                    throw new Error("Credentials not stored. Cannot re-initialize scraper.");
                }

                await this.initialize(this.credentials);

                const jobId = await this.startScrapingForTerm(
                    term.termId,
                    userId,
                    options
                );
                jobIds.push(jobId);

                // Cleanup after each term
                await this.cleanup();

                // Wait a bit between terms to avoid rate limiting
                await this.wait(5000);
            } catch (error) {
                console.error(`Failed to scrape term ${term.name}:`, error);
                // Continue with next term
            }
        }

        return jobIds;
    }

    private async saveFilterFields(
        termId: string,
        filterFields: any
    ): Promise<void> {
        await dbConnect();

        await FilterFields.findOneAndUpdate(
            { termId },
            {
                termId,
                universities: filterFields.universities || [],
                programs: filterFields.programs || [],
                degrees: filterFields.degrees || [],
                languages: filterFields.languages || [],
                campuses: filterFields.campuses || [],
                lastUpdated: new Date(),
            },
            { upsert: true, new: true }
        );
    }

    private async savePrograms(
        termId: string,
        result: ScrapeResult
    ): Promise<void> {
        await dbConnect();

        const programs = result.data.map((program) => ({
            programId: program.id,
            termId,
            programName: program.programName,
            alternativeProgramName: program.alternativeProgramName,
            universityName: program.universityName,
            universityLogo: program.universityLogo,
            universityId: program.universityId,
            programDegree: program.programDegree,
            language: program.language,
            campus: program.campus,
            tuitionFee: program.tuitionFee,
            discountedTuitionFee: program.discountedTuitionFee,
            currency: program.currency,
            depositPrice: program.depositPrice,
            prepSchoolFee: program.prepSchoolFee,
            cashPaymentFee: program.cashPaymentFee,
            quotaFull: program.quotaFull,
            semester: program.semester,
            termSettings: program.termSettings,
            academicYear: program.academicYear,
            lastScraped: new Date(),
            isActive: true,
        }));

        const bulkOps = programs.map((program) => ({
            updateOne: {
                filter: { termId: program.termId, programId: program.programId },
                update: { $set: program },
                upsert: true,
            },
        }));

        if (bulkOps.length > 0) {
            await Program.bulkWrite(bulkOps);
        }

        if (this.jobId) {
            await ScrapeJob.findByIdAndUpdate(this.jobId, {
                programsScraped: programs.length,
            });
        }
    }

    private async updateJobStatus(
        jobId: string,
        status: string,
        message?: string
    ): Promise<void> {
        await dbConnect();

        const update: any = { status };

        if (status === "running") {
            update.startedAt = new Date();
        } else if (status === "completed" || status === "failed") {
            update.completedAt = new Date();
        }

        if (message) {
            if (status === "failed") {
                update.error = message;
            }
            update.$push = { logs: message };
        }

        await ScrapeJob.findByIdAndUpdate(jobId, update);
    }

    private async updateJobLogs(jobId: string, message: string): Promise<void> {
        await dbConnect();

        await ScrapeJob.findByIdAndUpdate(jobId, {
            $push: { logs: `${new Date().toISOString()}: ${message}` },
        });
    }

    private async cleanup(): Promise<void> {
        if (this.scraper) {
            await this.scraper.close();
            this.scraper = null;
        }
    }

    private async wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Static methods
    static async getJobStatus(jobId: string): Promise<IScrapeJob | null> {
        await dbConnect();
        return ScrapeJob.findById(jobId).lean();
    }

    static async getAllJobs(limit: number = 50): Promise<IScrapeJob[]> {
        await dbConnect();
        return ScrapeJob.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("initiatedBy", "name email")
            .lean();
    }

    static async getAllTerms(): Promise<any[]> {
        await dbConnect();
        return Term.getAllTerms();
    }

    static async getTermById(termId: string): Promise<any> {
        await dbConnect();
        return Term.findByTermId(termId);
    }
}