"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleProfile = void 0;
const mongoose_1 = require("mongoose");
const RoleProfileSectionSchema = new mongoose_1.Schema({
    sectionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'SectionDefinition',
        required: true,
    },
    weight: {
        type: Number,
        required: true,
        validate: {
            validator: (value) => value > 0,
            message: 'Section weight must be greater than 0',
        },
    },
}, { _id: false });
const RoleProfileSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    experienceLevel: {
        type: String,
        required: true,
        enum: ['fresher', 'junior', 'mid', 'senior'],
    },
    sections: {
        type: [RoleProfileSectionSchema],
        required: true,
        validate: [
            {
                validator: (sections) => sections.length > 0,
                message: 'Role profile must have at least one section.',
            },
            {
                validator: (sections) => {
                    const ids = sections.map((s) => String(s.sectionId));
                    return new Set(ids).size === ids.length;
                },
                message: 'Duplicate sectionId found in role profile.',
            },
            {
                validator: (sections) => {
                    const totalWeight = sections.reduce((sum, s) => sum + s.weight, 0);
                    return totalWeight === 100;
                },
                message: 'Sum of section weights must equal 100',
            },
        ],
    },
    readinessThreshold: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    confidenceBuffer: {
        type: Number,
        default: 5,
        min: 0,
        max: 20
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
RoleProfileSchema.index({ name: 1 });
RoleProfileSchema.index({ experienceLevel: 1 });
RoleProfileSchema.index({ isActive: 1 });
const MODEL_NAME = 'RoleProfile';
const existingModel = mongoose_1.models[MODEL_NAME];
exports.RoleProfile = existingModel ?? (0, mongoose_1.model)(MODEL_NAME, RoleProfileSchema);
