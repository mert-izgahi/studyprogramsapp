// models/Program.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IProgram extends Document {
    programId: string;
    termId: string;
    programName: string;
    alternativeProgramName?: string;
    universityName: string;
    universityId: string;
    universityLogo: string;
    programDegree: string;
    language: string;
    campus: string;
    tuitionFee: number;
    discountedTuitionFee: number;
    currency: string;
    depositPrice: number;
    prepSchoolFee?: number;
    cashPaymentFee?: string;
    quotaFull: boolean;
    semester: string;
    termSettings: string;
    academicYear: string;
    lastScraped: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProgramModelType extends mongoose.Model<IProgram> {
    findProgram(termId: string, programId: string): Promise<IProgram | null>;
    findProgramsByTerm(termId: string): Promise<IProgram[]>;
    upsertProgram(data: Partial<IProgram>): Promise<IProgram>;
    bulkUpsertPrograms(programs: Partial<IProgram>[]): Promise<{ upsertedCount: number; modifiedCount: number }>;
}

const ProgramSchema = new Schema<IProgram>({
    programId: {
        type: String,
        required: true,
        index: true,
    },
    termId: {
        type: String,
        required: true,
        index: true,
        ref: "Term",
    },
    programName: {
        type: String,
        required: true,
        trim: true,
        index: "text",
    },
    alternativeProgramName: {
        type: String,
        trim: true,
    },
    universityName: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    universityId: {
        type: String,
        required: true,
        index: true,
    },
    universityLogo: {
        type: String,
        trim: true,
    },
    programDegree: {
        type: String,
        required: true,
        index: true,
    },
    language: {
        type: String,
        required: true,
        index: true,
    },
    campus: {
        type: String,
        trim: true,
        index: true,
    },
    tuitionFee: {
        type: Number,
        required: true,
        min: 0,
    },
    discountedTuitionFee: {
        type: Number,
        required: true,
        min: 0,
        index: true,
    },
    currency: {
        type: String,
        default: "USD",
    },
    depositPrice: {
        type: Number,
        default: 0,
        min: 0,
    },
    prepSchoolFee: {
        type: Number,
        min: 0,
    },
    cashPaymentFee: {
        type: String,
    },
    quotaFull: {
        type: Boolean,
        default: false,
        index: true,
    },
    semester: {
        type: String,
        required: true,
    },
    termSettings: {
        type: String,
        required: true,
    },
    academicYear: {
        type: String,
        required: true,
        index: true,
    },
    lastScraped: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});

// Compound indexes
ProgramSchema.index({ termId: 1, programId: 1 }, { unique: true });
ProgramSchema.index({ termId: 1, universityName: 1 });
ProgramSchema.index({ termId: 1, programDegree: 1 });
ProgramSchema.index({ termId: 1, language: 1 });
ProgramSchema.index({ termId: 1, quotaFull: 1 });
ProgramSchema.index({ termId: 1, discountedTuitionFee: 1 });
ProgramSchema.index({
    programName: "text",
    universityName: "text",
    alternativeProgramName: "text",
});

// Static methods
ProgramSchema.statics.findProgram = function (termId: string, programId: string) {
    return this.findOne({ termId, programId });
};

ProgramSchema.statics.findProgramsByTerm = function (termId: string) {
    return this.find({ termId, isActive: true });
};

ProgramSchema.statics.upsertProgram = async function (data: Partial<IProgram>) {
    const { termId, programId } = data;
    
    if (!termId || !programId) {
        throw new Error("termId and programId are required for upsert");
    }

    return this.findOneAndUpdate(
        { termId, programId },
        {
            ...data,
            lastScraped: new Date(),
        },
        {
            upsert: true,
            new: true,
            runValidators: true,
        }
    );
};

ProgramSchema.statics.bulkUpsertPrograms = async function (programs: Partial<IProgram>[]) {
    const bulkOps = programs.map(program => ({
        updateOne: {
            filter: { termId: program.termId, programId: program.programId },
            update: {
                $set: {
                    ...program,
                    lastScraped: new Date(),
                },
            },
            upsert: true,
        },
    }));

    const result = await this.bulkWrite(bulkOps);
    
    return {
        upsertedCount: result.upsertedCount || 0,
        modifiedCount: result.modifiedCount || 0,
    };
};

function createProgramModel(): ProgramModelType {
    if (mongoose.models && mongoose.models.Program) {
        return mongoose.models.Program as ProgramModelType;
    }
    return mongoose.model<IProgram, ProgramModelType>("Program", ProgramSchema);
}

export const Program = createProgramModel();