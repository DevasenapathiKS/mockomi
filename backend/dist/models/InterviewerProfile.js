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
const availabilitySchema = new mongoose_1.Schema({
    dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6,
    },
    slots: [{
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
        }],
}, { _id: false });
const interviewerProfileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    expertise: [{
            type: String,
            required: true,
            trim: true,
        }],
    experience: {
        type: Number,
        required: [true, 'Experience in years is required'],
        min: 0,
    },
    bio: {
        type: String,
        trim: true,
        maxlength: 2000,
    },
    linkedinUrl: {
        type: String,
        trim: true,
    },
    currentCompany: {
        type: String,
        trim: true,
    },
    currentPosition: {
        type: String,
        trim: true,
    },
    availability: [availabilitySchema],
    interviewTypes: [{
            type: String,
            enum: ['technical', 'behavioral', 'system_design', 'hr', 'coding', 'general'],
            trim: true,
        }],
    languages: [{
            type: String,
            trim: true,
        }],
    hourlyRate: {
        type: Number,
        default: 500,
        min: 0,
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    approvedAt: {
        type: Date,
    },
    approvedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    rejectionReason: {
        type: String,
        trim: true,
    },
    rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 },
    },
    interviewsCompleted: {
        type: Number,
        default: 0,
    },
    earnings: {
        type: Number,
        default: 0,
    },
    bankDetails: {
        accountHolderName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        ifscCode: { type: String, trim: true, uppercase: true },
        bankName: { type: String, trim: true },
        branchName: { type: String, trim: true },
        upiId: { type: String, trim: true },
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
// Indexes (userId index is already created by unique: true)
interviewerProfileSchema.index({ expertise: 1 });
interviewerProfileSchema.index({ isApproved: 1 });
interviewerProfileSchema.index({ 'rating.average': -1 });
interviewerProfileSchema.index({ interviewsCompleted: -1 });
// Text index for search
interviewerProfileSchema.index({
    expertise: 'text',
    bio: 'text',
    currentCompany: 'text',
    currentPosition: 'text',
});
const InterviewerProfile = mongoose_1.default.model('InterviewerProfile', interviewerProfileSchema);
exports.default = InterviewerProfile;
//# sourceMappingURL=InterviewerProfile.js.map