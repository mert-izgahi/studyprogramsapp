import dbConnect from "@/lib/mongoose";
import { Program, IProgram } from "@/models/Program";
import { FilterFields } from "@/models/FilterFields";
import mongoose from "mongoose";

export interface ProgramFilters {
    termId?: string;
    university?: string;
    degree?: string;
    language?: string;
    campus?: string;
    minPrice?: number;
    maxPrice?: number;
    quotaFull?: boolean;
    search?: string;
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface ProgramListResponse {
    programs: IProgram[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export class ProgramService {
    static async getPrograms(
        filters: ProgramFilters = {},
        options: PaginationOptions = {},
    ): Promise<ProgramListResponse> {
        await dbConnect();

        const {
            page = 1,
            limit = 20,
            sortBy = "discountedTuitionFee",
            sortOrder = "asc",
        } = options;

        const query: any = { isActive: true };

        if (filters.termId) {
            query.termId = filters.termId;
        }

        if (filters.university) {
            query.universityName = filters.university;
        }

        if (filters.degree) {
            query.programDegree = filters.degree;
        }

        if (filters.language) {
            query.language = filters.language;
        }

        if (filters.campus) {
            query.campus = filters.campus;
        }

        if (filters.quotaFull !== undefined) {
            query.quotaFull = filters.quotaFull;
        }

        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            query.discountedTuitionFee = {};
            if (filters.minPrice !== undefined) {
                query.discountedTuitionFee.$gte = filters.minPrice;
            }
            if (filters.maxPrice !== undefined) {
                query.discountedTuitionFee.$lte = filters.maxPrice;
            }
        }

        if (filters.search) {
            query.$text = { $search: filters.search };
        }

        const skip = (page - 1) * limit;

        const sort: any = {};
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;

        const [programs, total] = await Promise.all([
            Program.find(query).sort(sort).skip(skip).limit(limit).lean(),
            Program.countDocuments(query),
        ]);

        return {
            programs: programs as IProgram[],
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPreviousPage: page > 1,
            },
        };
    }

    static async getProgramById(id: string): Promise<IProgram | null> {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }

        return Program.findById(id).lean();
    }

    static async getProgramsByIds(ids: string[]): Promise<IProgram[]> {
        await dbConnect();

        const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

        return Program.find({
            _id: { $in: validIds },
            isActive: true,
        }).lean();
    }

    static async getFilterOptions(termId: string): Promise<any> {
        await dbConnect();

        const filterFields = await FilterFields.findOne({ termId }).lean();

        if (!filterFields) {
            return {
                universities: [],
                programs: [],
                degrees: [],
                languages: [],
                campuses: [],
            };
        }

        return {
            universities: filterFields.universities,
            programs: filterFields.programs,
            degrees: filterFields.degrees,
            languages: filterFields.languages,
            campuses: filterFields.campuses,
        };
    }

    static async getProgramStats(termId: string): Promise<any> {
        await dbConnect();

        const stats = await Program.aggregate([
            { $match: { termId, isActive: true } },
            {
                $group: {
                    _id: null,
                    totalPrograms: { $sum: 1 },
                    avgTuitionFee: { $avg: "$discountedTuitionFee" },
                    minTuitionFee: { $min: "$discountedTuitionFee" },
                    maxTuitionFee: { $max: "$discountedTuitionFee" },
                    totalUniversities: { $addToSet: "$universityName" },
                    programsByDegree: { $push: "$programDegree" },
                    programsByLanguage: { $push: "$language" },
                },
            },
        ]);

        if (stats.length === 0) {
            return {
                totalPrograms: 0,
                avgTuitionFee: 0,
                minTuitionFee: 0,
                maxTuitionFee: 0,
                totalUniversities: 0,
                degreeDistribution: {},
                languageDistribution: {},
            };
        }

        const result = stats[0];

        const degreeDistribution: Record<string, number> = {};
        result.programsByDegree.forEach((degree: string) => {
            degreeDistribution[degree] = (degreeDistribution[degree] || 0) + 1;
        });

        const languageDistribution: Record<string, number> = {};
        result.programsByLanguage.forEach((language: string) => {
            languageDistribution[language] =
                (languageDistribution[language] || 0) + 1;
        });

        return {
            totalPrograms: result.totalPrograms,
            avgTuitionFee: Math.round(result.avgTuitionFee),
            minTuitionFee: result.minTuitionFee,
            maxTuitionFee: result.maxTuitionFee,
            totalUniversities: result.totalUniversities.length,
            degreeDistribution,
            languageDistribution,
        };
    }

    static async searchPrograms(
        searchTerm: string,
        termId?: string,
        limit: number = 20,
    ): Promise<IProgram[]> {
        await dbConnect();

        const query: any = {
            $text: { $search: searchTerm },
            isActive: true,
        };

        if (termId) {
            query.termId = termId;
        }

        return Program.find(query)
            .sort({ score: { $meta: "textScore" } })
            .limit(limit)
            .lean();
    }
}