import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  IJobSeekerProfile,
  IEducation,
  IWorkExperience,
  ISkill,
  IProject,
  ICertification,
  ISocialLinks,
  IResume,
  IJobPreferences,
  EducationLevel,
  EmploymentType,
} from '../types';

export interface IJobSeekerProfileDocument extends Omit<IJobSeekerProfile, 'userId'>, Document {
  userId: Types.ObjectId;
}

const educationSchema = new Schema<IEducation>(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    field: { type: String, required: true, trim: true },
    level: {
      type: String,
      enum: Object.values(EducationLevel),
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    grade: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: true }
);

const workExperienceSchema = new Schema<IWorkExperience>(
  {
    company: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    employmentType: {
      type: String,
      enum: Object.values(EmploymentType),
      required: true,
    },
    location: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
  },
  { _id: true }
);

const skillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true, trim: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true,
    },
    yearsOfExperience: { type: Number, min: 0 },
  },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    technologies: [{ type: String, trim: true }],
    url: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
  },
  { _id: true }
);

const certificationSchema = new Schema<ICertification>(
  {
    name: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date },
    credentialId: { type: String, trim: true },
    credentialUrl: { type: String, trim: true },
  },
  { _id: true }
);

const socialLinksSchema = new Schema<ISocialLinks>(
  {
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    twitter: { type: String, trim: true },
    other: [{ type: String, trim: true }],
  },
  { _id: false }
);

const resumeSchema = new Schema<IResume>(
  {
    url: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    parsedData: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const jobPreferencesSchema = new Schema<IJobPreferences>(
  {
    expectedSalary: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: 'INR' },
    },
    preferredLocations: [{ type: String, trim: true }],
    employmentTypes: [{
      type: String,
      enum: Object.values(EmploymentType),
    }],
    noticePeriod: { type: Number, min: 0 },
    isOpenToRemote: { type: Boolean, default: true },
    isActivelyLooking: { type: Boolean, default: true },
  },
  { _id: false }
);

const jobSeekerProfileSchema = new Schema<IJobSeekerProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    headline: { type: String, trim: true, maxlength: 200 },
    summary: { type: String, trim: true, maxlength: 2000 },
    dateOfBirth: { type: Date },
    gender: { type: String, trim: true },
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    education: [educationSchema],
    experience: [workExperienceSchema],
    skills: [skillSchema],
    projects: [projectSchema],
    certifications: [certificationSchema],
    socialLinks: socialLinksSchema,
    resume: resumeSchema,
    preferences: jobPreferencesSchema,
    interviewStats: {
      totalInterviews: { type: Number, default: 0 },
      freeInterviewsUsed: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
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
jobSeekerProfileSchema.index({ 'skills.name': 1 });
jobSeekerProfileSchema.index({ 'location.city': 1, 'location.state': 1 });
jobSeekerProfileSchema.index({ 'experience.company': 1 });
jobSeekerProfileSchema.index({ 'interviewStats.averageRating': -1 });
jobSeekerProfileSchema.index({ 'preferences.isActivelyLooking': 1 });

// Text index for search
jobSeekerProfileSchema.index({
  headline: 'text',
  summary: 'text',
  'skills.name': 'text',
  'experience.title': 'text',
  'experience.company': 'text',
});

const JobSeekerProfile = mongoose.model<IJobSeekerProfileDocument>(
  'JobSeekerProfile',
  jobSeekerProfileSchema
);

export default JobSeekerProfile;
