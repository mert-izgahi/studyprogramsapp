import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IFilterFields extends Document {
    termId: string;
    universities: string[];
    programs: string[];
    degrees: string[];
    languages: string[];
    campuses: string[];
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IFilterFieldsModelType extends mongoose.Model<IFilterFields> {
    findFilterFields(termId: string): Promise<IFilterFields | null>;
    updateFilterFields(termId: string, data: Partial<IFilterFields>): Promise<IFilterFields>;
}

const FilterFieldsSchema = new Schema<IFilterFields>({
    termId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        ref: "Term",
    },
    universities: {
        type: [String],
        default: [],
    },
    programs: {
        type: [String],
        default: [],
    },
    degrees: {
        type: [String],
        default: [],
    },
    languages: {
        type: [String],
        default: [],
    },
    campuses: {
        type: [String],
        default: [],
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

FilterFieldsSchema.statics.findFilterFields = async function (termId: string) {
    return this.findOne({ termId });
};

FilterFieldsSchema.statics.updateFilterFields = async function (termId: string, data: Partial<IFilterFields>) {
    const filterFields = await this.findOne({ termId });
    if (!filterFields) return null;
    Object.assign(filterFields, data);
    await filterFields.save();
    return filterFields;
};

function createFilterFieldsModel(): IFilterFieldsModelType {
    // Check if the model already exists
    if (mongoose.models && mongoose.models.FilterFields) {
        return mongoose.models.FilterFields as IFilterFieldsModelType;
    }

    // Create new model if it doesn't exist
    return mongoose.model<IFilterFields, IFilterFieldsModelType>("FilterFields", FilterFieldsSchema);
}

export const FilterFields = createFilterFieldsModel();