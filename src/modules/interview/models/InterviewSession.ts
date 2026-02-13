import { Schema, model, models, Types, type Model } from 'mongoose';

export type InterviewDifficultyLevel =
  | 'confidence'
  | 'guided'
  | 'simulation'
  | 'stress';

export type ReadinessStatus = 'ready' | 'not_ready';

export type InterviewSessionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface IInterviewSession {
  candidateId: string;
  roleProfileId: Types.ObjectId;
  interviewerId?: Types.ObjectId;
  slotId?: Types.ObjectId;
  scheduledAt?: Date;
  rescheduleCount: number;
  mediaMeetingCreated: boolean;
  mediaCreationAttempts: number;
  scoringModelVersion: number;
  level: InterviewDifficultyLevel;
  overallScore: number;
  readinessScore: number;
  readinessStatus: ReadinessStatus | null;
  readinessGap: number;
  status: InterviewSessionStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const InterviewSessionSchema = new Schema<IInterviewSession>(
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
    interviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    slotId: {
      type: Schema.Types.ObjectId,
      ref: 'AvailabilitySlot',
    },
    scheduledAt: {
      type: Date,
    },
    rescheduleCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    mediaMeetingCreated: {
      type: Boolean,
      default: false,
    },
    mediaCreationAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    scoringModelVersion: {
      type: Number,
      required: true,
    },
    level: {
      type: String,
      required: true,
      enum: ['confidence', 'guided', 'simulation', 'stress'],
    },
    overallScore: {
      type: Number,
      default: 0,
    },
    readinessScore: {
      type: Number,
      default: 0,
    },
    readinessStatus: {
      type: String,
      enum: ['ready', 'not_ready'],
      default: null,
    },
    readinessGap: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
  },
);

InterviewSessionSchema.index({ candidateId: 1 });
InterviewSessionSchema.index({ roleProfileId: 1 });
InterviewSessionSchema.index({ status: 1 });
InterviewSessionSchema.index({ candidateId: 1, status: 1, createdAt: -1 });

const MODEL_NAME = 'InterviewSession';
const existingModel = models[MODEL_NAME] as Model<IInterviewSession> | undefined;

export const InterviewSession =
  existingModel ?? model<IInterviewSession>(MODEL_NAME, InterviewSessionSchema);

