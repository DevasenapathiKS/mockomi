import { Schema, model, models, Types, type Model } from 'mongoose';

export interface IInterviewerProfile {
  userId: Types.ObjectId;
  bio: string;
  yearsOfExperience: number;
  primaryTechStack: string[];
  linkedinUrl: string;
  isVerified: boolean;
  ratingAverage: number;
  totalRatings: number;
  totalInterviews: number;
  earningsTotal: number;
  isActive: boolean;
}

const InterviewerProfileSchema = new Schema<IInterviewerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      required: true,
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
    },
    primaryTechStack: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => Array.isArray(value) && value.length > 0,
        message: 'primaryTechStack must have at least one item',
      },
    },
    linkedinUrl: {
      type: String,
      required: true,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    ratingAverage: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalInterviews: {
      type: Number,
      default: 0,
    },
    earningsTotal: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

InterviewerProfileSchema.index({ userId: 1 }, { unique: true });
InterviewerProfileSchema.index({ isVerified: 1 });

const MODEL_NAME = 'InterviewerProfile';
const existingModel =
  models[MODEL_NAME] as Model<IInterviewerProfile> | undefined;

export const InterviewerProfile =
  existingModel ??
  model<IInterviewerProfile>(MODEL_NAME, InterviewerProfileSchema);

