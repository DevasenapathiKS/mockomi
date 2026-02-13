"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionScore = void 0;
const mongoose_1 = require("mongoose");
const SectionScoreSchema = new mongoose_1.Schema({
    sessionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'InterviewSession',
        required: true,
    },
    sectionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'SectionDefinition',
        required: true,
    },
    rawScore: {
        type: Number,
        required: true,
        min: 0,
        max: 10,
    },
    weightedScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
}, {
    timestamps: true,
});
SectionScoreSchema.index({ sessionId: 1 });
SectionScoreSchema.index({ sectionId: 1 });
const MODEL_NAME = 'SectionScore';
const existingModel = mongoose_1.models[MODEL_NAME];
exports.SectionScore = existingModel ?? (0, mongoose_1.model)(MODEL_NAME, SectionScoreSchema);
