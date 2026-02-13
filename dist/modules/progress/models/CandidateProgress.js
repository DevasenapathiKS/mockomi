"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidateProgress = void 0;
const mongoose_1 = require("mongoose");
const CandidateProgressSchema = new mongoose_1.Schema({
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
    totalSessions: {
        type: Number,
        default: 0,
    },
    averageScore: {
        type: Number,
        default: 0,
    },
    latestScore: {
        type: Number,
        default: 0,
    },
    previousScore: {
        type: Number,
        default: 0,
    },
    improvementDelta: {
        type: Number,
        default: 0,
    },
    lastUpdated: {
        type: Date,
    },
}, {
    timestamps: true,
});
CandidateProgressSchema.index({ candidateId: 1, roleProfileId: 1 }, { unique: true });
const MODEL_NAME = 'CandidateProgress';
const existingModel = mongoose_1.models[MODEL_NAME];
exports.CandidateProgress = existingModel ??
    (0, mongoose_1.model)(MODEL_NAME, CandidateProgressSchema);
