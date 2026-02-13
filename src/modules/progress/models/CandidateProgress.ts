import { Schema, model, models, Types, type Model } from 'mongoose';

export interface ICandidateProgress {
  candidateId: string;
  roleProfileId: Types.ObjectId;
  totalSessions: number;
  averageScore: number;
  latestScore: number;
  previousScore: number;
  improvementDelta: number;
  lastUpdated?: Date;
}

const CandidateProgressSchema = new Schema<ICandidateProgress>(
  {
    candidateId: {
      type: String,
      required: true,
      trim: true,
    },
    roleProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'RoleProfile',
      required: true,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    latestScore: {
      type: Number,
      default: 0,
    },
    previousScore: {
      type: Number,
      default: 0,
    },
    improvementDelta: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

CandidateProgressSchema.index(
  { candidateId: 1, roleProfileId: 1 },
  { unique: true },
);

const MODEL_NAME = 'CandidateProgress';
const existingModel = models[MODEL_NAME] as Model<ICandidateProgress> | undefined;

export const CandidateProgress =
  existingModel ??
  model<ICandidateProgress>(MODEL_NAME, CandidateProgressSchema);

