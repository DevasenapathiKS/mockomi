import mongoose, { Schema, Document, Types } from 'mongoose';
import { IInterview, IInterviewFeedback, InterviewStatus } from '../types';

export interface IInterviewDocument extends Omit<IInterview, '_id' | 'jobSeekerId' | 'interviewerId' | 'payment'>, Document {
  jobSeekerId: Types.ObjectId;
  interviewerId: Types.ObjectId;
  payment?: Types.ObjectId;
}

const interviewFeedbackSchema = new Schema<IInterviewFeedback>(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    technicalSkills: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    problemSolving: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    overallPerformance: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    strengths: [{
      type: String,
      trim: true,
    }],
    areasOfImprovement: [{
      type: String,
      trim: true,
    }],
    detailedFeedback: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const interviewSchema = new Schema<IInterviewDocument>(
  {
    jobSeekerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    interviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Null until an interviewer claims the request
    },
    // Requested skills/topics for the interview
    requestedSkills: [{
      type: String,
      trim: true,
    }],
    // Preferred duration requested by job seeker
    preferredDuration: {
      type: Number,
      default: 60,
      min: 30,
      max: 120,
    },
    // Additional notes from job seeker
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // Actual scheduled time (set when interviewer claims)
    scheduledAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 60,
      min: 15,
      max: 180,
    },
    status: {
      type: String,
      enum: Object.values(InterviewStatus),
      default: InterviewStatus.REQUESTED,
    },
    type: {
      type: String,
      enum: ['mock', 'real'],
      default: 'mock',
    },
    topic: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    meetingUrl: {
      type: String,
      trim: true,
    },
    // When the request was claimed by interviewer
    claimedAt: {
      type: Date,
      default: null,
    },
    // Request expiry time (e.g., 7 days from creation)
    expiresAt: {
      type: Date,
      default: null,
    },
    videoRecording: {
      url: { type: String },
      s3Key: { type: String },
      duration: { type: Number },
      size: { type: Number },
      uploadedAt: { type: Date },
    },
    feedback: interviewFeedbackSchema,
    payment: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        const transformed = ret as Record<string, unknown>;
        delete transformed.__v;
        return transformed;
      },
    },
  }
);

// Indexes
interviewSchema.index({ jobSeekerId: 1 });
interviewSchema.index({ interviewerId: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ scheduledAt: 1 });
interviewSchema.index({ type: 1 });
interviewSchema.index({ isPaid: 1 });
interviewSchema.index({ createdAt: -1 });
interviewSchema.index({ requestedSkills: 1 });
interviewSchema.index({ expiresAt: 1 });

// Compound indexes
interviewSchema.index({ jobSeekerId: 1, status: 1 });
interviewSchema.index({ interviewerId: 1, status: 1 });
interviewSchema.index({ interviewerId: 1, scheduledAt: 1 });
interviewSchema.index({ 'feedback.rating': -1 });
// Index for finding available requests by status and skills
interviewSchema.index({ status: 1, requestedSkills: 1, expiresAt: 1 });

const Interview = mongoose.model<IInterviewDocument>('Interview', interviewSchema);

export default Interview;
