import dbConnect from "@/lib/mongoose";
import { FavoriteList, IFavoriteList } from "@/models/FavoriteList";
import { Program } from "@/models/Program";
import mongoose from "mongoose";

export class FavoriteListService {
    static async createList(
        userId: string,
        name: string,
        description?: string,
        isDefault: boolean = false,
    ): Promise<IFavoriteList> {
        await dbConnect();

        const existingList = await FavoriteList.findOne({ userId, name });
        if (existingList) {
            throw new Error("A list with this name already exists");
        }

        const list = await FavoriteList.create({
            userId,
            name,
            description,
            isDefault,
            programs: [],
        });

        return list.toObject();
    }

    static async getUserLists(userId: string): Promise<IFavoriteList[]> {
        await dbConnect();

        return FavoriteList.find({ userId })
            .sort({ isDefault: -1, createdAt: -1 })
            .populate({
                path: "programs",
                match: { isActive: true },
                select:
                    "programName universityName discountedTuitionFee currency programDegree language",
            })
            .lean();
    }

    static async getListById(
        listId: string,
        userId: string,
    ): Promise<IFavoriteList | null> {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(listId)) {
            return null;
        }

        return FavoriteList.findOne({ _id: listId, userId })
            .populate({
                path: "programs",
                match: { isActive: true },
            })
            .lean();
    }

    static async updateList(
        listId: string,
        userId: string,
        updates: { name?: string; description?: string; isDefault?: boolean },
    ): Promise<IFavoriteList | null> {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(listId)) {
            return null;
        }

        if (updates.name) {
            const existingList = await FavoriteList.findOne({
                userId,
                name: updates.name,
                _id: { $ne: listId },
            });

            if (existingList) {
                throw new Error("A list with this name already exists");
            }
        }

        return FavoriteList.findOneAndUpdate(
            { _id: listId, userId },
            { $set: updates },
            { new: true },
        )
            .populate("programs")
            .lean();
    }

    static async deleteList(listId: string, userId: string): Promise<boolean> {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(listId)) {
            return false;
        }

        const result = await FavoriteList.deleteOne({ _id: listId, userId });
        return result.deletedCount > 0;
    }

    static async addProgramToList(
        listId: string,
        userId: string,
        programId: string,
    ): Promise<IFavoriteList | null> {
        await dbConnect();

        if (
            !mongoose.Types.ObjectId.isValid(listId) ||
            !mongoose.Types.ObjectId.isValid(programId)
        ) {
            return null;
        }

        const program = await Program.findById(programId);
        if (!program) {
            throw new Error("Program not found");
        }

        const list = await FavoriteList.findOne({ _id: listId, userId });
        if (!list) {
            return null;
        }

        if (list.programs.includes(programId as any)) {
            throw new Error("Program already in list");
        }

        return FavoriteList.findOneAndUpdate(
            { _id: listId, userId },
            { $addToSet: { programs: programId } },
            { new: true },
        )
            .populate("programs")
            .lean();
    }

    static async removeProgramFromList(
        listId: string,
        userId: string,
        programId: string,
    ): Promise<IFavoriteList | null> {
        await dbConnect();

        if (
            !mongoose.Types.ObjectId.isValid(listId) ||
            !mongoose.Types.ObjectId.isValid(programId)
        ) {
            return null;
        }

        return FavoriteList.findOneAndUpdate(
            { _id: listId, userId },
            { $pull: { programs: programId } },
            { new: true },
        )
            .populate("programs")
            .lean();
    }

    static async getOrCreateDefaultList(userId: string): Promise<IFavoriteList> {
        await dbConnect();

        let defaultList = await FavoriteList.findOne({ userId, isDefault: true });

        if (!defaultList) {
            defaultList = await FavoriteList.create({
                userId,
                name: "My Favorites",
                description: "Default favorite list",
                isDefault: true,
                programs: [],
            });
        }

        return defaultList.toObject();
    }

    static async isProgramInAnyList(
        userId: string,
        programId: string,
    ): Promise<boolean> {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(programId)) {
            return false;
        }

        const count = await FavoriteList.countDocuments({
            userId,
            programs: programId,
        });

        return count > 0;
    }

    static async getListsContainingProgram(
        userId: string,
        programId: string,
    ): Promise<IFavoriteList[]> {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(programId)) {
            return [];
        }

        return FavoriteList.find({
            userId,
            programs: programId,
        })
            .select("_id name")
            .lean();
    }
}