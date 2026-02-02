import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITerm extends Document {
    termId: string;
    name: string;
    academicYear: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface TermModelType extends Model<ITerm> {
    findTerm(termId: string): Promise<ITerm | null>;
}

const TermSchema = new Schema<ITerm>({
    termId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    academicYear: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

TermSchema.statics.findTerm = async function (termId: string) {
    return this.findOne({ termId });
};

function createTermModel(): TermModelType {
    // Check if the model already exists
    if (mongoose.models && mongoose.models.Term) {
        return mongoose.models.Term as TermModelType;
    }

    // Create new model if it doesn't exist
    return mongoose.model<ITerm, TermModelType>("Term", TermSchema);
}

export const Term = createTermModel();

