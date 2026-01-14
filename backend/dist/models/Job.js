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
const jobSchema = new mongoose_1.Schema({
    employerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    companyId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: Object.values(types_1.ExperienceLevel),
        required: true,
    },
    // experienceYears: {
    //   min: { type: Number, required: false, min: 0 },
    //   max: { type: Number, required: false, min: 0 },
    // },
    employmentType: {
        type: String,
        enum: Object.values(types_1.EmploymentType),
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
        enum: Object.values(types_1.JobStatus),
        default: types_1.JobStatus.DRAFT,
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
const Job = mongoose_1.default.model('Job', jobSchema);
exports.default = Job;
//# sourceMappingURL=Job.js.map