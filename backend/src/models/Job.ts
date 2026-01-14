import mongoose, { Schema, Document, Types } from 'mongoose';
import { IJob, JobStatus, EmploymentType, ExperienceLevel } from '../types';

export interface IJobDocument extends Omit<IJob, '_id' | 'employerId' | 'companyId'>, Document {
  employerId: Types.ObjectId;
  companyId: Types.ObjectId;
}

const jobSchema = new Schema<IJobDocument>(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'CompanyProfile',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      maxlength: 10000,
    },
    requirements: [{
      type: String,
      trim: true,
    }],
    responsibilities: [{
      type: String,
      trim: true,
    }],
    skills: [{
      type: String,
      required: true,
      trim: true,
    }],
    experienceLevel: {
      type: String,
      enum: Object.values(ExperienceLevel),
      required: true,
    },
    // experienceYears: {
    //   min: { type: Number, required: false, min: 0 },
    //   max: { type: Number, required: false, min: 0 },
    // },
    employmentType: {
      type: String,
      enum: Object.values(EmploymentType),
      required: true,
    },
    salary: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: 'INR' },
      isNegotiable: { type: Boolean, default: false },
      showOnListing: { type: Boolean, default: true },
    },
    location: {
      city: { type: String, required: true, trim: true },
      state: { type: String, trim: true },
      country: { type: String, required: true, trim: true },
      isRemote: { type: Boolean, default: false },
      isHybrid: { type: Boolean, default: false },
    },
    benefits: [{
      type: String,
      trim: true,
    }],
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.DRAFT,
    },
    applicationDeadline: {
      type: Date,
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
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
jobSchema.index({ employerId: 1 });
jobSchema.index({ companyId: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ employmentType: 1 });
jobSchema.index({ 'location.city': 1, 'location.country': 1 });
jobSchema.index({ 'location.isRemote': 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ 'salary.min': 1, 'salary.max': 1 });

// Text index for search
jobSchema.index({
  title: 'text',
  description: 'text',
  skills: 'text',
  requirements: 'text',
});

// Compound indexes for common queries
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ employerId: 1, status: 1 });
jobSchema.index({ skills: 1, status: 1, createdAt: -1 });

const Job = mongoose.model<IJobDocument>('Job', jobSchema);

export default Job;
