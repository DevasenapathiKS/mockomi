"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const types_1 = require("../types");
const educationSchema = new mongoose_1.Schema({
    institution: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    field: { type: String, required: true, trim: true },
    level: {
        type: String,
        enum: Object.values(types_1.EducationLevel),
        required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    grade: { type: String, trim: true },
    description: { type: String, trim: true },
}, { _id: true });
const workExperienceSchema = new mongoose_1.Schema({
    company: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    employmentType: {
        type: String,
        enum: Object.values(types_1.EmploymentType),
        required: true,
    },
    location: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
}, { _id: true });
const skillSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        required: true,
    },
    yearsOfExperience: { type: Number, min: 0 },
}, { _id: false });
const projectSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    technologies: [{ type: String, trim: true }],
    url: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
}, { _id: true });
const certificationSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date },
    credentialId: { type: String, trim: true },
    credentialUrl: { type: String, trim: true },
}, { _id: true });
const socialLinksSchema = new mongoose_1.Schema({
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    twitter: { type: String, trim: true },
    other: [{ type: String, trim: true }],
}, { _id: false });
const resumeSchema = new mongoose_1.Schema({
    url: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    parsedData: { type: mongoose_1.Schema.Types.Mixed },
}, { _id: false });
const jobPreferencesSchema = new mongoose_1.Schema({
    expectedSalary: {
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 },
        currency: { type: String, default: 'INR' },
    },
    preferredLocations: [{ type: String, trim: true }],
    employmentTypes: [{
            type: String,
            enum: Object.values(types_1.EmploymentType),
        }],
    noticePeriod: { type: Number, min: 0 },
    isOpenToRemote: { type: Boolean, default: true },
    isActivelyLooking: { type: Boolean, default: true },
}, { _id: false });
const jobSeekerProfileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
    toJSON: {
        transform: (_, ret) => {
            const transformed = ret;
            delete transformed.__v;
            return transformed;
        },
    },
});
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
const JobSeekerProfile = mongoose_1.default.model('JobSeekerProfile', jobSeekerProfileSchema);
exports.default = JobSeekerProfile;
//# sourceMappingURL=JobSeekerProfile.js.map