"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewerProfile = void 0;
const mongoose_1 = require("mongoose");
const InterviewerProfileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    bio: {
        type: String,
        required: true,
        trim: true,
    },
    yearsOfExperience: {
        type: Number,
        required: true,
        min: 0,
    },
    primaryTechStack: {
        type: [String],
        required: true,
        validate: {
            validator: (value) => Array.isArray(value) && value.length > 0,
            message: 'primaryTechStack must have at least one item',
        },
    },
    linkedinUrl: {
        type: String,
        required: true,
        trim: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    ratingAverage: {
        type: Number,
        default: 0,
    },
    totalRatings: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalInterviews: {
        type: Number,
        default: 0,
    },
    earningsTotal: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });
InterviewerProfileSchema.index({ userId: 1 }, { unique: true });
InterviewerProfileSchema.index({ isVerified: 1 });
const MODEL_NAME = 'InterviewerProfile';
const existingModel = mongoose_1.models[MODEL_NAME];
exports.InterviewerProfile = existingModel ??
    (0, mongoose_1.model)(MODEL_NAME, InterviewerProfileSchema);
