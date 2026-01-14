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
const jobApplicationSchema = new mongoose_1.Schema({
    jobId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
    },
    jobSeekerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    coverLetter: {
        type: String,
        trim: true,
        maxlength: 5000,
    },
    resumeUrl: {
        type: String,
        required: [true, 'Resume is required'],
    },
    status: {
        type: String,
        enum: Object.values(types_1.ApplicationStatus),
        default: types_1.ApplicationStatus.APPLIED,
    },
    appliedAt: {
        type: Date,
        default: Date.now,
    },
    reviewedAt: {
        type: Date,
    },
    reviewedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 2000,
    },
    interviewScheduled: {
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
jobApplicationSchema.index({ jobId: 1 });
jobApplicationSchema.index({ jobSeekerId: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ appliedAt: -1 });
jobApplicationSchema.index({ jobId: 1, jobSeekerId: 1 }, { unique: true }); // Prevent duplicate applications
// Compound indexes
jobApplicationSchema.index({ jobId: 1, status: 1 });
jobApplicationSchema.index({ jobSeekerId: 1, status: 1 });
const JobApplication = mongoose_1.default.model('JobApplication', jobApplicationSchema);
exports.default = JobApplication;
//# sourceMappingURL=JobApplication.js.map