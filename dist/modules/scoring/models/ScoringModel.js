"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringModel = void 0;
const mongoose_1 = require("mongoose");
const PositiveNumber = {
    type: Number,
    required: true,
    validate: {
        validator: (value) => value > 0,
        message: 'Value must be greater than 0',
    },
};
const DifficultyMultipliersSchema = new mongoose_1.Schema({
    confidence: PositiveNumber,
    guided: PositiveNumber,
    simulation: PositiveNumber,
    stress: PositiveNumber,
}, { _id: false });
const ScoringModelSchema = new mongoose_1.Schema({
    version: {
        type: Number,
        required: true,
        unique: true,
        validate: {
            validator: (value) => value > 0,
            message: 'Version must be a positive number',
        },
    },
    difficultyMultipliers: {
        type: DifficultyMultipliersSchema,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
// ScoringModelSchema.index({ version: 1 }, { unique: true });
ScoringModelSchema.index({ isActive: 1 });
const MODEL_NAME = 'ScoringModel';
const existingModel = mongoose_1.models[MODEL_NAME];
exports.ScoringModel = existingModel ?? (0, mongoose_1.model)(MODEL_NAME, ScoringModelSchema);
