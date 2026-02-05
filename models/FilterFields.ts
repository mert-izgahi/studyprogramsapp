// models/FilterFields.ts
import mongoose, { Schema, Document } from "mongoose";

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
    upsertFilterFields(termId: string, data: Partial<IFilterFields>): Promise<IFilterFields>;
    addFilterValues(termId: string, field: string, values: string[]): Promise<IFilterFields | null>;
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

FilterFieldsSchema.statics.upsertFilterFields = async function (
    termId: string,
    data: Partial<IFilterFields>
) {
    // Remove duplicates from arrays
    const cleanData: any = { termId };
    
    if (data.universities) {
        cleanData.universities = Array.from(new Set(data.universities));
    }
    if (data.programs) {
        cleanData.programs = Array.from(new Set(data.programs));
    }
    if (data.degrees) {
        cleanData.degrees = Array.from(new Set(data.degrees));
    }
    if (data.languages) {
        cleanData.languages = Array.from(new Set(data.languages));
    }
    if (data.campuses) {
        cleanData.campuses = Array.from(new Set(data.campuses));
    }

    cleanData.lastUpdated = new Date();

    return this.findOneAndUpdate(
        { termId },
        { $set: cleanData },
        {
            upsert: true,
            new: true,
            runValidators: true,
        }
    );
};

FilterFieldsSchema.statics.addFilterValues = async function (
    termId: string,
    field: string,
    values: string[]
) {
    const validFields = ['universities', 'programs', 'degrees', 'languages', 'campuses'];
    
    if (!validFields.includes(field)) {
        throw new Error(`Invalid field: ${field}`);
    }

    const uniqueValues = Array.from(new Set(values));

    return this.findOneAndUpdate(
        { termId },
        {
            $addToSet: {
                [field]: { $each: uniqueValues },
            },
            $set: { lastUpdated: new Date() },
        },
        { new: true, upsert: true }
    );
};

function createFilterFieldsModel(): IFilterFieldsModelType {
    if (mongoose.models && mongoose.models.FilterFields) {
        return mongoose.models.FilterFields as IFilterFieldsModelType;
    }
    return mongoose.model<IFilterFields, IFilterFieldsModelType>("FilterFields", FilterFieldsSchema);
}

export const FilterFields = createFilterFieldsModel();