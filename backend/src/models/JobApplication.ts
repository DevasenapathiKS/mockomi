import mongoose, { Schema, Document, Types } from 'mongoose';
import { IJobApplication, ApplicationStatus } from '../types';

export interface IJobApplicationDocument extends Omit<IJobApplication, '_id' | 'jobId' | 'jobSeekerId' | 'reviewedBy'>, Document {
  jobId: Types.ObjectId;
  jobSeekerId: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
}

const jobApplicationSchema = new Schema<IJobApplicationDocument>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    jobSeekerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    resumeUrl: {
      type: String,
      required: [true, 'Resume is required'],
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.APPLIED,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    interviewScheduled: {
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
jobApplicationSchema.index({ jobId: 1 });
jobApplicationSchema.index({ jobSeekerId: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ appliedAt: -1 });
jobApplicationSchema.index({ jobId: 1, jobSeekerId: 1 }, { unique: true }); // Prevent duplicate applications

// Compound indexes
jobApplicationSchema.index({ jobId: 1, status: 1 });
jobApplicationSchema.index({ jobSeekerId: 1, status: 1 });

const JobApplication = mongoose.model<IJobApplicationDocument>(
  'JobApplication',
  jobApplicationSchema
);

export default JobApplication;
