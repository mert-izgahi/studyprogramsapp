import mongoose, { Schema, Document } from "mongoose";

export interface ITerm extends Document {
    termId: string;
    name: string;
    academicYear: string;
    isActive: boolean;
    isScraped: boolean;
    programCount: number;
    lastScrapedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface TermModelType extends mongoose.Model<ITerm> {
    findActiveTerm(): Promise<ITerm | null>;
    findByTermId(termId: string): Promise<ITerm | null>;
    getAllTerms(): Promise<ITerm[]>;
    markAsScraped(termId: string, programCount: number): Promise<ITerm | null>;
}

const TermSchema = new Schema<ITerm>(
    {
        termId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        academicYear: {
            type: String,
            required: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        isScraped: {
            type: Boolean,
            default: false,
            index: true,
        },
        programCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        lastScrapedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
TermSchema.index({ isActive: 1, isScraped: 1 });
TermSchema.index({ academicYear: 1 });
TermSchema.index({ createdAt: -1 });

// Static methods
TermSchema.statics.findActiveTerm = function () {
    return this.findOne({ isActive: true }).sort({ createdAt: -1 });
};

TermSchema.statics.findByTermId = function (termId: string) {
    return this.findOne({ termId });
};

TermSchema.statics.getAllTerms = function () {
    return this.find().sort({ createdAt: -1 });
};

TermSchema.statics.markAsScraped = function (
    termId: string,
    programCount: number
) {
    return this.findOneAndUpdate(
        { termId },
        {
            isScraped: true,
            programCount,
            lastScrapedAt: new Date(),
        },
        { new: true }
    );
};

function createTermModel(): TermModelType {
    if (mongoose.models && mongoose.models.Term) {
        return mongoose.models.Term as TermModelType;
    }
    return mongoose.model<ITerm, TermModelType>("Term", TermSchema);
}

export const Term = createTermModel();