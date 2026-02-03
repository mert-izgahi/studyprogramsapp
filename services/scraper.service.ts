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

    async initialize(credentials: LoginCredentials): Promise<void> {
        this.scraper = new UnitedEducationScraper(credentials, {
            headless: true,
            timeout: 60000,
        });

        await this.scraper.initialize();
        await this.scraper.login();
    }

    async startScrapingForTerm(
        termName: string,
        userId: string,
        options?: ProgramSearchOptions,
    ): Promise<string> {
        if (!this.scraper) {
            throw new Error("Scraper not initialized. Call initialize() first.");
        }

        await dbConnect();

        try {
            const termId = await this.scraper.setupProgramSearch(termName);

            const job = await ScrapeJob.create({
                termId,
                termName,
                status: "pending",
                initiatedBy: userId,
                logs: [`Scraping started for term: ${termName}`],
            });

            this.jobId = job._id.toString();

            await this.updateJobStatus(
                this.jobId,
                "running",
                "Fetching filter fields...",
            );

            const filterFields = await this.scraper.getAvailableFilters();
            await this.saveFilterFields(termId, filterFields);
            await this.updateJobLogs(this.jobId, "Filter fields saved successfully");

            await this.updateJobLogs(this.jobId, "Starting program scraping...");
            const result = await this.scraper.scrapePrograms(options);

            await this.savePrograms(termId, result);

            await this.saveTerm(termId, termName);

            await this.updateJobStatus(
                this.jobId,
                "completed",
                `Successfully scraped ${result.data.length} programs`,
            );

            return this.jobId;
        } catch (error) {
            if (this.jobId) {
                await this.updateJobStatus(
                    this.jobId,
                    "failed",
                    `Error: ${(error as Error).message}`,
                );
            }
            throw error;
        } finally {
            await this.cleanup();
        }
    }

    private async saveTerm(termId: string, termName: string): Promise<void> {
        await dbConnect();

        const academicYear = termName.match(/\d{4}-\d{4}/)?.[0] || "";

        await Term.findOneAndUpdate(
            { termId },
            {
                termId,
                name: termName,
                academicYear,
                isActive: true,
            },
            { upsert: true, new: true },
        );
    }

    private async saveFilterFields(
        termId: string,
        filterFields: any,
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
            { upsert: true, new: true },
        );
    }

    private async savePrograms(
        termId: string,
        result: ScrapeResult,
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
        message?: string,
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
}