// services/scraper.service.ts
import mongoose from "mongoose";
import { Term } from "@/models/Term";
import { Program } from "@/models/Program";
import { ScrapeJob, IScrapeJob } from "@/models/ScrapeJob";
import type { ProgramScrapingType, FilterFieldsScrapingType } from "@/types";

export class ScraperDatabaseService {
    /**
     * Find-or-create a Term document for the given termId string (e.g. "1").
     * Returns the Mongoose document so the caller can update it.
     */
    static async createScrapeJob(
        termId: string,
        termName: string,
        userId: string
    ): Promise<IScrapeJob> {
        // Upsert the Term so it exists in the DB
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

        // Create a fresh ScrapeJob
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
     * Persist scraped filter-field metadata onto the Term document.
     */
    static async saveFilterFields(
        termId: string,
        filters: FilterFieldsScrapingType
    ): Promise<void> {
        // We store a summary as a sub-document / JSON field.
        // Extend ITerm if you want richer storage; for now we just log counts.
        const counts = Object.fromEntries(
            Object.entries(filters).map(([k, v]) => [k, v.length])
        );
        console.log(`💾 Filter fields for term ${termId}:`, counts);
        // Optionally persist to a FilterField collection here.
    }

    /**
     * Bulk-upsert all scraped programs into MongoDB.
     * Resolves the Term's ObjectId first so Program.termId (ObjectId ref) is correct.
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

        // Update Term stats
        await Term.markAsScraped(termId, programs.length);
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

    // ── Helpers ──────────────────────────────────────────────────────────────
    private static extractAcademicYear(termName: string): string {
        const match = termName.match(/\d{4}[\s\-\/]\d{4}|\d{4}/);
        return match ? match[0] : termName;
    }
}