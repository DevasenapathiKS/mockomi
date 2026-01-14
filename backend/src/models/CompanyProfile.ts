import mongoose, { Schema, Document, Types } from 'mongoose';
import { ICompanyProfile, ISocialLinks } from '../types';

export interface ICompanyProfileDocument extends Omit<ICompanyProfile, 'userId'>, Document {
  userId: Types.ObjectId;
}

const companyProfileSchema = new Schema<ICompanyProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: 200,
    },
    companyEmail: {
      type: String,
      required: [true, 'Company email is required'],
      lowercase: true,
      trim: true,
    },
    companyPhone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    industry: {
      type: String,
      trim: true,
    },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'],
    },
    founded: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },
    headquarters: {
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    socialLinks: {
      linkedin: { type: String, trim: true },
      github: { type: String, trim: true },
      twitter: { type: String, trim: true },
      portfolio: { type: String, trim: true },
      other: [{ type: String, trim: true }],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDocuments: [{
      type: String,
    }],
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
companyProfileSchema.index({ companyName: 1 });
companyProfileSchema.index({ companyEmail: 1 });
companyProfileSchema.index({ industry: 1 });
companyProfileSchema.index({ 'headquarters.city': 1, 'headquarters.country': 1 });
companyProfileSchema.index({ isVerified: 1 });

// Text index for search
companyProfileSchema.index({
  companyName: 'text',
  description: 'text',
  industry: 'text',
});

const CompanyProfile = mongoose.model<ICompanyProfileDocument>(
  'CompanyProfile',
  companyProfileSchema
);

export default CompanyProfile;
