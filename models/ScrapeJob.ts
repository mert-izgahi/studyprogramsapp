// models/ScrapeJob.ts
import mongoose, { Schema, Model, Document } from "mongoose";

export type ScrapeStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface IScrapeJob extends Document {
    termId: string;
    termName: string;
    status: ScrapeStatus;
    startedAt?: Date;
    completedAt?: Date;
    programsScraped: number;
    filterFieldsScraped: boolean;
    universitiesProcessed: number;
    error?: string;
    logs: Array<{
        timestamp: Date;
        message: string;
        level: "info" | "warn" | "error";
    }>;
    progress: {
        currentPage: number;
        totalPages: number;
        percentage: number;
    };
    initiatedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IScrapeJobModelType extends Model<IScrapeJob> {
    findScrapeJob(termId: string): Promise<IScrapeJob | null>;
    findActiveScrapeJob(): Promise<IScrapeJob | null>;
    updateScrapeJob(termId: string, data: Partial<IScrapeJob>): Promise<IScrapeJob | null>;
    addLog(termId: string, message: string, level?: "info" | "warn" | "error"): Promise<IScrapeJob | null>;
    updateProgress(termId: string, currentPage: number, totalPages: number): Promise<IScrapeJob | null>;
}

const ScrapeJobSchema = new Schema<IScrapeJob>({
    termId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        ref: "Term",
    },
    termName: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ["pending", "running", "completed", "failed", "cancelled"],
        default: "pending",
        index: true,
    },
    startedAt: {
        type: Date,
    },
    completedAt: {
        type: Date,
    },
    programsScraped: {
        type: Number,
        default: 0,
    },
    filterFieldsScraped: {
        type: Boolean,
        default: false,
    },
    universitiesProcessed: {
        type: Number,
        default: 0,
    },
    error: {
        type: String,
    },
    logs: [{
        timestamp: {
            type: Date,
            default: Date.now,
        },
        message: String,
        level: {
            type: String,
            enum: ["info", "warn", "error"],
            default: "info",
        },
    }],
    progress: {
        currentPage: {
            type: Number,
            default: 0,
        },
        totalPages: {
            type: Number,
            default: 0,
        },
        percentage: {
            type: Number,
            default: 0,
        },
    },
    initiatedBy: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
}, {
    timestamps: true,
});

// Indexes
ScrapeJobSchema.index({ status: 1, createdAt: -1 });
ScrapeJobSchema.index({ termId: 1, status: 1 });

// Static methods
ScrapeJobSchema.statics.findScrapeJob = function (termId: string) {
    return this.findOne({ termId }).sort({ createdAt: -1 });
};

ScrapeJobSchema.statics.findActiveScrapeJob = function () {
    return this.findOne({
        status: { $in: ["pending", "running"] }
    }).sort({ createdAt: -1 });
};

ScrapeJobSchema.statics.updateScrapeJob = function (
    termId: string,
    data: Partial<IScrapeJob>
) {
    return this.findOneAndUpdate({ termId }, data, { new: true });
};

ScrapeJobSchema.statics.addLog = function (
    termId: string,
    message: string,
    level: "info" | "warn" | "error" = "info"
) {
    return this.findOneAndUpdate(
        { termId },
        {
            $push: {
                logs: {
                    timestamp: new Date(),
                    message,
                    level,
                },
            },
        },
        { new: true }
    );
};

ScrapeJobSchema.statics.updateProgress = function (
    termId: string,
    currentPage: number,
    totalPages: number
) {
    const percentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
    
    return this.findOneAndUpdate(
        { termId },
        {
            $set: {
                "progress.currentPage": currentPage,
                "progress.totalPages": totalPages,
                "progress.percentage": percentage,
            },
        },
        { new: true }
    );
};

function createScrapeJobModel(): IScrapeJobModelType {
    if (mongoose.models && mongoose.models.ScrapeJob) {
        return mongoose.models.ScrapeJob as IScrapeJobModelType;
    }
    return mongoose.model<IScrapeJob, IScrapeJobModelType>("ScrapeJob", ScrapeJobSchema);
}

export const ScrapeJob = createScrapeJobModel();