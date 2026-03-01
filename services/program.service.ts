import dbConnect from "@/lib/mongoose";
import { Program, IProgram } from "@/models/Program";
import { PaginationInfo } from "@/types";
import mongoose from "mongoose";

export interface ProgramFilters {
    termId?: string;
    universities?: string;
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
    rows: IProgram[];
    pagination: PaginationInfo;
}

export class ProgramService {
    static async getPrograms(
        filters: ProgramFilters = {},
        options: PaginationOptions = {},
    ): Promise<ProgramListResponse> {
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

        if (filters.universities) {
            query.universityName = { $in: filters.universities.split(",") };
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
            query.$or = [
                { programName: { $regex: filters.search, $options: "i" } },
                { universityName: { $regex: filters.search, $options: "i" } },
                { programDegree: { $regex: filters.search, $options: "i" } },
                { language: { $regex: filters.search, $options: "i" } },
                { campus: { $regex: filters.search, $options: "i" } },
            ]
        }

        const skip = (page - 1) * limit;

        const sort: any = {};
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;
        const [programs, total] = await Promise.all([
            Program.find(query).sort(sort).skip(skip).limit(limit).lean(),
            Program.countDocuments(query),
        ]);

        return {
            rows: programs as IProgram[],
            pagination: {
                totalRecords: total,
                currentPage: page,
                recordsPerPage: limit,
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


        const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

        return Program.find({
            _id: { $in: validIds },
            isActive: true,
        }).lean();
    }

    static async getFilterOptions(termId: string): Promise<any> {

        const programs = await Program.find({ termId, isActive: true }).lean();
        const universities = programs.map((program) => program.universityName);
        const degrees = programs.map((program) => program.programDegree);
        const languages = programs.map((program) => program.language);
        const campuses = programs.map((program) => program.campus);
        return {
            universities: Array.from(new Set(universities)),
            degrees: Array.from(new Set(degrees)),
            languages: Array.from(new Set(languages)),
            campuses: Array.from(new Set(campuses)),
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