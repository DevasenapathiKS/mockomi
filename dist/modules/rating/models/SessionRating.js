"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRating = void 0;
const mongoose_1 = require("mongoose");
const SessionRatingSchema = new mongoose_1.Schema({
    sessionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'InterviewSession',
        required: true,
        unique: true,
    },
    candidateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    interviewerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
            validator: (value) => Number.isInteger(value),
            message: 'rating must be an integer',
        },
    },
    comment: {
        type: String,
        trim: true,
    },
}, { timestamps: true });
SessionRatingSchema.index({ sessionId: 1 }, { unique: true });
SessionRatingSchema.index({ interviewerId: 1 });
SessionRatingSchema.index({ candidateId: 1 });
const MODEL_NAME = 'SessionRating';
const existingModel = mongoose_1.models[MODEL_NAME];
exports.SessionRating = existingModel ?? (0, mongoose_1.model)(MODEL_NAME, SessionRatingSchema);
