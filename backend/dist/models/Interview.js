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
const interviewFeedbackSchema = new mongoose_1.Schema({
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
}, { _id: false });
const interviewSchema = new mongoose_1.Schema({
    jobSeekerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    interviewerId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: Object.values(types_1.InterviewStatus),
        default: types_1.InterviewStatus.REQUESTED,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment',
    },
    isPaid: {
        type: Boolean,
        default: false,
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
const Interview = mongoose_1.default.model('Interview', interviewSchema);
exports.default = Interview;
//# sourceMappingURL=Interview.js.map