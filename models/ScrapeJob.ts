import mongoose, { Schema, Model, Document } from "mongoose";

export type ScrapeStatus = "pending" | "running" | "completed" | "failed";

export interface IScrapeJob extends Document {
  termId: string;
  termName: string;
  status: ScrapeStatus;
  startedAt?: Date;
  completedAt?: Date;
  programsScraped: number;
  error?: string;
  logs: string[];
  initiatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScrapeJobModelType extends Model<IScrapeJob> {
  findScrapeJob(termId: string): Promise<IScrapeJob | null>;
  updateScrapeJob(termId: string, data: Partial<IScrapeJob>): Promise<IScrapeJob>;
}

const ScrapeJobSchema = new Schema<IScrapeJob>({
  termId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    ref: "Term",
  },
  termName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "running", "completed", "failed"],
    default: "pending",
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  programsScraped: {
    type: Number,
    default: 0,
  },
  error: {
    type: String,
  },
  logs: {
    type: [String],
    default: [],
  },
  initiatedBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
}, {
  timestamps: true,
});

ScrapeJobSchema.index({ status: 1, createdAt: -1 });
ScrapeJobSchema.index({ termId: 1, status: 1 });

ScrapeJobSchema.statics.findScrapeJob = function (termId: string) {
  return this.findOne({ termId });
};

ScrapeJobSchema.statics.updateScrapeJob = function (termId: string, data: Partial<IScrapeJob>) {
  return this.findOneAndUpdate({ termId }, data, { new: true });
};

function createScrapeJobModel(): IScrapeJobModelType {
  // Check if the model already exists
  if (mongoose.models && mongoose.models.ScrapeJob) {
    return mongoose.models.ScrapeJob as IScrapeJobModelType;
  }

  // Create new model if it doesn't exist
  return mongoose.model<IScrapeJob, IScrapeJobModelType>("ScrapeJob", ScrapeJobSchema);
}

export const ScrapeJob = createScrapeJobModel();