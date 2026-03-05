import dbConnect from "@/lib/mongoose";
import { Program, IProgram } from "@/models/Program";
import { Term } from "@/models/Term";
import { PaginationInfo, PaginationOptions } from "@/types";
import mongoose from "mongoose";

export interface ProgramFilters {
    termId?: string;
    universities?: string;
    languages?: string;
    campuses?: string;
    degrees?: string;
    minPrice?: number;
    maxPrice?: number;
    quotaFull?: boolean;
    search?: string;
}

export interface ProgramListResponse {
    rows: IProgram[];
    pagination: PaginationInfo;
}

// Maps degree label → keywords to match in programName
const DEGREE_KEYWORDS: Record<string, string[]> = {
    'Bachelor':          ['bachelor'],
    'Master':            ['master'],
    'Vocational School': ['vocational'],
    'PhD':               ['phd', 'doctorate'],
}

const getProgramsQuery = async (filters: ProgramFilters, options: PaginationOptions) => {
    const {
        page = 1,
        limit = 20,
        sortBy = "discountedTuitionFee",
        sortOrder = "asc",
    } = options;

    const query: any = { isActive: true };

    if (filters.universities) {
        query.universityName = { $in: filters.universities.split(",") };
    }

    if (filters.languages) {
        query.language = { $in: filters.languages.split(",") };
    }

    if (filters.campuses) {
        query.campus = { $in: filters.campuses.split(",") };
    }

    // ✅ Fix: match degree by keyword in programName instead of exact programName match
    if (filters.degrees) {
        const selectedDegrees = filters.degrees.split(",")

        // Collect all regex patterns for all selected degree labels
        const degreePatterns = selectedDegrees.flatMap((degreeLabel) => {
            const keywords = DEGREE_KEYWORDS[degreeLabel] ?? [degreeLabel.toLowerCase()]
            return keywords.map((kw) => ({
                programName: { $regex: kw, $options: "i" }
            }))
        })

        if (degreePatterns.length > 0) {
            // If search is also active, combine with AND logic
            if (query.$or) {
                query.$and = [
                    { $or: query.$or },
                    { $or: degreePatterns },
                ]
                delete query.$or
            } else {
                query.$or = degreePatterns
            }
        }
    }

    if (filters.quotaFull !== undefined) {
        query.quotaFull = filters.quotaFull;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        query.tuitionFee = {};
        if (filters.minPrice !== undefined) {
            query.tuitionFee.$gte = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
            query.tuitionFee.$lte = filters.maxPrice;
        }
    }

    if (filters.search) {
        const searchOr = [
            { programName: { $regex: filters.search, $options: "i" } },
            { universityName: { $regex: filters.search, $options: "i" } },
            { programDegree: { $regex: filters.search, $options: "i" } },
            { language: { $regex: filters.search, $options: "i" } },
            { campus: { $regex: filters.search, $options: "i" } },
        ]

        // If degrees filter already used $or, combine safely with $and
        if (query.$or) {
            query.$and = [
                ...(query.$and ?? []),
                { $or: query.$or },
                { $or: searchOr },
            ]
            delete query.$or
        } else {
            query.$or = searchOr
        }
    }

    if (filters.termId) {
        const term = await Term.findById(filters.termId);
        if (term) {
            query.termId = term._id.toString();
        }
    }

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    return {
        query,
        options: { page, limit, skip, sort },
    }
}

export class ProgramService {
    static async getPrograms(
        filters: ProgramFilters = {},
        options: PaginationOptions = {},
    ): Promise<ProgramListResponse> {
        const { query, options: paginationOptions } = await getProgramsQuery(filters, options);
        const { page, limit, skip, sort } = paginationOptions;

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
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return Program.findById(id).lean();
    }

    static async getProgramsByIds(ids: string[]): Promise<IProgram[]> {
        const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
        return Program.find({ _id: { $in: validIds }, isActive: true }).lean();
    }

    static async getFilterOptions(): Promise<any> {
        const programs = await Program.find({ isActive: true }).lean();
        const universities = programs.map((p) => p.universityName);
        const languages = programs.map((p) => p.language);
        const campuses = programs.map((p) => p.campus);
        return {
            universities: Array.from(new Set(universities)),
            languages: Array.from(new Set(languages)),
            campuses: Array.from(new Set(campuses)),
            // Degrees are static — no need to derive from DB
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
            return { totalPrograms: 0, avgTuitionFee: 0, minTuitionFee: 0, maxTuitionFee: 0, totalUniversities: 0, degreeDistribution: {}, languageDistribution: {} };
        }

        const result = stats[0];
        const degreeDistribution: Record<string, number> = {};
        result.programsByDegree.forEach((d: string) => {
            degreeDistribution[d] = (degreeDistribution[d] || 0) + 1;
        });
        const languageDistribution: Record<string, number> = {};
        result.programsByLanguage.forEach((l: string) => {
            languageDistribution[l] = (languageDistribution[l] || 0) + 1;
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

    static async searchPrograms(searchTerm: string, termId?: string, limit = 20): Promise<IProgram[]> {
        await dbConnect();
        const query: any = { $text: { $search: searchTerm }, isActive: true };
        if (termId) query.termId = termId;
        return Program.find(query).sort({ score: { $meta: "textScore" } }).limit(limit).lean();
    }
}