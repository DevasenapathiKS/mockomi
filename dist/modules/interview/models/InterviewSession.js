"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewSession = void 0;
const mongoose_1 = require("mongoose");
const InterviewSessionSchema = new mongoose_1.Schema({
    candidateId: {
        type: String,
        required: true,
        trim: true,
    },
    roleProfileId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'RoleProfile',
        required: true,
    },
    interviewerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    slotId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AvailabilitySlot',
    },
    scheduledAt: {
        type: Date,
    },
    rescheduleCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    mediaMeetingCreated: {
        type: Boolean,
        default: false,
    },
    mediaCreationAttempts: {
        type: Number,
        default: 0,
        min: 0,
    },
    scoringModelVersion: {
        type: Number,
        required: true,
    },
    level: {
        type: String,
        required: true,
        enum: ['confidence', 'guided', 'simulation', 'stress'],
    },
    overallScore: {
        type: Number,
        default: 0,
    },
    readinessScore: {
        type: Number,
        default: 0,
    },
    readinessStatus: {
        type: String,
        enum: ['ready', 'not_ready'],
        default: null,
    },
    readinessGap: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        default: 'scheduled',
    },
}, {
    timestamps: true,
});
InterviewSessionSchema.index({ candidateId: 1 });
InterviewSessionSchema.index({ roleProfileId: 1 });
InterviewSessionSchema.index({ status: 1 });
InterviewSessionSchema.index({ candidateId: 1, status: 1, createdAt: -1 });
const MODEL_NAME = 'InterviewSession';
const existingModel = mongoose_1.models[MODEL_NAME];
exports.InterviewSession = existingModel ?? (0, mongoose_1.model)(MODEL_NAME, InterviewSessionSchema);
