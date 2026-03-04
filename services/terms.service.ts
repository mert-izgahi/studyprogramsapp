import dbConnect from "@/lib/mongoose";
import { Term, ITerm } from "@/models/Term";
import { PaginationInfo, PaginationOptions } from "@/types";
import mongoose from "mongoose";

export interface TermFilters {
    isActive?: boolean;
    search?: string;
}

export interface TermsListResponse {
    rows: ITerm[];
    pagination: PaginationInfo;
}

export class TermService {
    static async getTerms(
        filters: TermFilters,
        options: PaginationOptions
    ): Promise<TermsListResponse> {
        await dbConnect();

        const {
            page = 1,
            limit = 20,
            sortBy = "name",
            sortOrder = "asc",
        } = options;

        const query: any = { isActive: true };

        if (filters.isActive) {
            query.isActive = filters.isActive;
        }

        if (filters.search) {
            query.name = { $regex: filters.search, $options: "i" };
        }
        const skip = (page - 1) * limit;
        const sort: any = {};
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;

        const [terms, total] = await Promise.all([
            Term.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Term.countDocuments(query),
        ])



        return {
            rows: terms,
            pagination: {
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalRecords: total,
                recordsPerPage: limit,
                hasNextPage: page < Math.ceil(total / limit),
                hasPreviousPage: page > 1,
            },
        };
    }

    static async getTerm(id: string): Promise<ITerm | null> {
        await dbConnect();
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }
        return Term.findById(id).lean();
    }
}
