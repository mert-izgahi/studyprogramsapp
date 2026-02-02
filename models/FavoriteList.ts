import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFavoriteList extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  programs: mongoose.Types.ObjectId[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoriteListModelType extends Model<IFavoriteList> { }

const FavoriteListSchema = new Schema<IFavoriteList>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  programs: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: "Program",
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

FavoriteListSchema.index({ userId: 1, name: 1 });
FavoriteListSchema.index({ userId: 1, isDefault: 1 });

FavoriteListSchema.pre("save", async function () {
  if (this.isDefault && this.isModified("isDefault")) {
    await mongoose
      .model("FavoriteList")
      .updateMany(
        { userId: this.userId, _id: { $ne: this._id } },
        { $set: { isDefault: false } },
      );
  }
});

function createFavoriteListModel(): FavoriteListModelType {
  // Check if the model already exists
  if (mongoose.models && mongoose.models.FavoriteList) {
    return mongoose.models.FavoriteList as FavoriteListModelType;
  }

  // Create new model if it doesn't exist
  return mongoose.model<IFavoriteList, FavoriteListModelType>("FavoriteList", FavoriteListSchema);
}

export const FavoriteList = createFavoriteListModel();