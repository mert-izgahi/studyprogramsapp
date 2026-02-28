// models/ScrapeJob.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IScrapeJobLog {
    message: string;
    level: "info" | "warn" | "error";
    timestamp: Date;
}

export interface IScrapeJob extends Document {
    termId: string;           // the raw term value from the scraper radio (e.g. "1")
    termName: string;
    userId: string;
    status: "pending" | "running" | "completed" | "failed";
    startedAt?: Date;
    completedAt?: Date;
    programCount?: number;
    error?: string;
    logs: IScrapeJobLog[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ScrapeJobModelType extends mongoose.Model<IScrapeJob> {
    addLog(termId: string, message: string, level?: "info" | "warn" | "error"): Promise<void>;
}

const ScrapeJobSchema = new Schema<IScrapeJob>(
    {
        termId: { type: String, required: true },
        termName: { type: String, required: true },
        userId: { type: String, required: true, default: "system" },
        status: {
            type: String,
            enum: ["pending", "running", "completed", "failed"],
            default: "pending",
        },
        startedAt: { type: Date },
        completedAt: { type: Date },
        programCount: { type: Number },
        error: { type: String },
        logs: [
            {
                message: { type: String, required: true },
                level: { type: String, enum: ["info", "warn", "error"], default: "info" },
                timestamp: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

// Static: push a log entry to the most-recent ScrapeJob for a given termId
ScrapeJobSchema.statics.addLog = async function (
    termId: string,
    message: string,
    level: "info" | "warn" | "error" = "info"
): Promise<void> {
    await this.findOneAndUpdate(
        { termId, status: { $in: ["pending", "running"] } },
        {
            $push: {
                logs: { message, level, timestamp: new Date() },
            },
        },
        { sort: { createdAt: -1 } }
    );
    const prefix = level === "error" ? "❌" : level === "warn" ? "⚠️" : "ℹ️";
    console.log(`${prefix} [${termId}] ${message}`);
};

function createScrapeJobModel(): ScrapeJobModelType {
    if (mongoose.models?.ScrapeJob) {
        return mongoose.models.ScrapeJob as ScrapeJobModelType;
    }
    return mongoose.model<IScrapeJob, ScrapeJobModelType>("ScrapeJob", ScrapeJobSchema);
}

export const ScrapeJob = createScrapeJobModel();