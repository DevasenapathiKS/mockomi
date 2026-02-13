"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionDefinition = void 0;
const mongoose_1 = require("mongoose");
const SectionDefinitionSchema = new mongoose_1.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    label: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// SectionDefinitionSchema.index({ key: 1 }, { unique: true });
SectionDefinitionSchema.index({ isActive: 1 });
const MODEL_NAME = 'SectionDefinition';
const existingModel = mongoose_1.models[MODEL_NAME];
exports.SectionDefinition = existingModel ?? (0, mongoose_1.model)(MODEL_NAME, SectionDefinitionSchema);
