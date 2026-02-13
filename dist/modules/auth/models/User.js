"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['candidate', 'interviewer', 'admin'],
        default: 'candidate',
    },
}, {
    timestamps: true,
});
UserSchema.index({ email: 1 }, { unique: true });
const MODEL_NAME = 'User';
const existingModel = mongoose_1.models[MODEL_NAME];
exports.User = existingModel ?? (0, mongoose_1.model)(MODEL_NAME, UserSchema);
