import mongoose, { Schema, Document, Types } from 'mongoose';
import { IInterviewerProfile, IAvailability } from '../types';

export interface IInterviewerProfileDocument extends Omit<IInterviewerProfile, 'userId' | 'approvedBy'>, Document {
  userId: Types.ObjectId;
  approvedBy?: Types.ObjectId;
}

const availabilitySchema = new Schema<IAvailability>(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    slots: [{
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    }],
  },
  { _id: false }
);

const interviewerProfileSchema = new Schema<IInterviewerProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    expertise: [{
      type: String,
      required: true,
      trim: true,
    }],
    experience: {
      type: Number,
      required: [true, 'Experience in years is required'],
      min: 0,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    linkedinUrl: {
      type: String,
      trim: true,
    },
    currentCompany: {
      type: String,
      trim: true,
    },
    currentPosition: {
      type: String,
      trim: true,
    },
    availability: [availabilitySchema],
    interviewTypes: [{
      type: String,
      enum: ['technical', 'behavioral', 'system_design', 'hr', 'coding', 'general'],
      trim: true,
    }],
    languages: [{
      type: String,
      trim: true,
    }],
    hourlyRate: {
      type: Number,
      default: 500,
      min: 0,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    interviewsCompleted: {
      type: Number,
      default: 0,
    },
    earnings: {
      type: Number,
      default: 0,
    },
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true, uppercase: true },
      bankName: { type: String, trim: true },
      branchName: { type: String, trim: true },
      upiId: { type: String, trim: true },
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

// Indexes (userId index is already created by unique: true)
interviewerProfileSchema.index({ expertise: 1 });
interviewerProfileSchema.index({ isApproved: 1 });
interviewerProfileSchema.index({ 'rating.average': -1 });
interviewerProfileSchema.index({ interviewsCompleted: -1 });

// Text index for search
interviewerProfileSchema.index({
  expertise: 'text',
  bio: 'text',
  currentCompany: 'text',
  currentPosition: 'text',
});

const InterviewerProfile = mongoose.model<IInterviewerProfileDocument>(
  'InterviewerProfile',
  interviewerProfileSchema
);

export default InterviewerProfile;
