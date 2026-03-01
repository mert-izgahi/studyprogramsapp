// services/scraper.service.ts
import mongoose from "mongoose";
import { Term } from "@/models/Term";
import { Program } from "@/models/Program";
import { ScrapeJob, IScrapeJob } from "@/models/ScrapeJob";
import type { ProgramScrapingType, FilterFieldsScrapingType } from "@/types";

// ─── Shape returned by getScrapeJobStatus ────────────────────────────────────
export interface ScrapeJobStatus {
    _id: string;
    termId: string;
    termName: string;
    userId: string;
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    startedAt?: Date;
    completedAt?: Date;
    programCount?: number;
    error?: string;
    /** Last 10 log entries (most-recent last) */
    logs: Array<{ message: string; level: string; timestamp: Date }>;
    createdAt: Date;
    updatedAt: Date;
}

export class ScraperDatabaseService {
    // ─── Job lifecycle ────────────────────────────────────────────────────────

    /**
     * Upsert the Term document, then create a fresh ScrapeJob in "pending" status.
     */
    static async createScrapeJob(
        termId: string,
        termName: string,
        userId: string
    ): Promise<IScrapeJob> {
        await Term.findOneAndUpdate(
            { termId },
            {
                $setOnInsert: {
                    termId,
                    name: termName,
                    academicYear: ScraperDatabaseService.extractAcademicYear(termName),
                    isActive: true,
                    isScraped: false,
                    programCount: 0,
                },
            },
            { upsert: true, new: true }
        );

        const job = await ScrapeJob.create({
            termId,
            termName,
            userId,
            status: "pending",
        });

        console.log(`📋 ScrapeJob created: ${job._id} for term "${termName}" (${termId})`);
        return job;
    }

    /**
     * Returns the most-recent ScrapeJob for a termId, or null if none exists.
     * Includes only the last 10 log entries to keep the payload lean.
     */
    static async getScrapeJobStatus(termId: string): Promise<ScrapeJobStatus | null> {
        const job = await ScrapeJob.findOne({ termId })
            .sort({ createdAt: -1 })
            .lean();

        if (!job) return null;

        return {
            _id: String(job._id),
            termId: job.termId,
            termName: job.termName,
            userId: job.userId,
            status: job.status,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            programCount: job.programCount,
            error: job.error,
            logs: (job.logs ?? []).slice(-10),
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
        };
    }

    /**
     * Marks the most-recent active job for a term as "cancelled".
     * Does not kill the Puppeteer process — call scraper.destroy() for that.
     */
    static async cancelScrapeJob(termId: string): Promise<void> {
        await ScrapeJob.findOneAndUpdate(
            { termId, status: { $in: ["pending", "running"] } },
            {
                $set: {
                    status: "cancelled",
                    completedAt: new Date(),
                },
                $push: {
                    logs: {
                        message: "Job cancelled via API",
                        level: "warn",
                        timestamp: new Date(),
                    },
                },
            },
            { sort: { createdAt: -1 } }
        );
        console.log(`⚠️  ScrapeJob cancelled for term ${termId}`);
    }

    /**
     * Mark the running ScrapeJob as completed or failed.
     */
    static async completeScrapeJob(
        termId: string,
        success: boolean,
        error?: string
    ): Promise<void> {
        const update: Record<string, unknown> = {
            status: success ? "completed" : "failed",
            completedAt: new Date(),
        };
        if (error) update.error = error;

        await ScrapeJob.findOneAndUpdate(
            { termId, status: { $in: ["pending", "running"] } },
            { $set: update },
            { sort: { createdAt: -1 } }
        );

        if (success) {
            const term = await Term.findOne({ termId });
            if (term) {
                await ScrapeJob.findOneAndUpdate(
                    { termId, status: "completed" },
                    { $set: { programCount: term.programCount } },
                    { sort: { createdAt: -1 } }
                );
            }
        }

        console.log(
            success
                ? `✅ ScrapeJob completed for term ${termId}`
                : `❌ ScrapeJob failed for term ${termId}: ${error}`
        );
    }

    // ─── Data persistence ─────────────────────────────────────────────────────

    /** Log filter-field counts (extend to persist to DB if needed). */
    static async saveFilterFields(
        termId: string,
        filters: FilterFieldsScrapingType
    ): Promise<void> {
        const counts = Object.fromEntries(
            Object.entries(filters).map(([k, v]) => [k, v.length])
        );
        console.log(`💾 Filter fields for term ${termId}:`, counts);
    }

    /**
     * Bulk-upsert all scraped programs.
     * Resolves the Term ObjectId so Program.termId (ref) is correctly typed.
     */
    static async savePrograms(
        termId: string,
        programs: ProgramScrapingType[]
    ): Promise<void> {
        const term = await Term.findOne({ termId });
        if (!term) throw new Error(`Term "${termId}" not found in DB`);

        const termObjectId = term._id as mongoose.Types.ObjectId;

        const docs = programs.map((p) => ({
            programId: p.id,
            termId: termObjectId,
            programName: p.programName,
            alternativeProgramName: p.alternativeProgramName || undefined,
            universityName: p.universityName,
            universityId: p.universityId,
            universityLogo: p.universityLogo,
            programDegree: p.programDegree,
            language: p.language,
            campus: p.campus,
            tuitionFee: p.tuitionFee,
            discountedTuitionFee: p.discountedTuitionFee,
            currency: p.currency || "USD",
            depositPrice: p.depositPrice,
            prepSchoolFee: p.prepSchoolFee || undefined,
            cashPaymentFee: p.cashPaymentFee || undefined,
            quotaFull: p.quotaFull,
            semester: p.semester,
            termSettings: p.termSettings,
            academicYear: p.academicYear,
            isActive: true,
            lastScraped: new Date(),
        }));

        const { upsertedCount, modifiedCount } = await Program.bulkUpsertPrograms(docs);
        console.log(`💾 Programs saved — upserted: ${upsertedCount}, updated: ${modifiedCount}`);

        await Term.markAsScraped(termId, programs.length);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    private static extractAcademicYear(termName: string): string {
        const match = termName.match(/\d{4}[\s\-\/]\d{4}|\d{4}/);
        return match ? match[0] : termName;
    }
}