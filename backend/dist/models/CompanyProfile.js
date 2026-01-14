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
const companyProfileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        maxlength: 200,
    },
    companyEmail: {
        type: String,
        required: [true, 'Company email is required'],
        lowercase: true,
        trim: true,
    },
    companyPhone: {
        type: String,
        trim: true,
    },
    website: {
        type: String,
        trim: true,
    },
    logo: {
        type: String,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 5000,
    },
    industry: {
        type: String,
        trim: true,
    },
    companySize: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'],
    },
    founded: {
        type: Number,
        min: 1800,
        max: new Date().getFullYear(),
    },
    headquarters: {
        address: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, trim: true },
        pincode: { type: String, trim: true },
    },
    socialLinks: {
        linkedin: { type: String, trim: true },
        github: { type: String, trim: true },
        twitter: { type: String, trim: true },
        portfolio: { type: String, trim: true },
        other: [{ type: String, trim: true }],
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationDocuments: [{
            type: String,
        }],
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
companyProfileSchema.index({ companyName: 1 });
companyProfileSchema.index({ companyEmail: 1 });
companyProfileSchema.index({ industry: 1 });
companyProfileSchema.index({ 'headquarters.city': 1, 'headquarters.country': 1 });
companyProfileSchema.index({ isVerified: 1 });
// Text index for search
companyProfileSchema.index({
    companyName: 'text',
    description: 'text',
    industry: 'text',
});
const CompanyProfile = mongoose_1.default.model('CompanyProfile', companyProfileSchema);
exports.default = CompanyProfile;
//# sourceMappingURL=CompanyProfile.js.map