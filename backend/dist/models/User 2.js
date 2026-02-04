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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("../types");
const config_1 = __importDefault(require("../config"));
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
        type: String,
        required: function () {
            // Password is required only if local auth is enabled
            return !this.authProviders || !Object.keys(this.authProviders).some(key => key !== 'local' && this.authProviders[key]);
        },
        minlength: [8, 'Password must be at least 8 characters'],
        select: false,
    },
    // OAuth Provider Tracking
    authProviders: {
        type: {
            local: {
                type: {
                    enabled: { type: Boolean, default: false },
                    createdAt: { type: Date, default: Date.now },
                },
                required: false,
            },
            google: {
                type: {
                    id: { type: String, required: true },
                    email: String,
                    linkedAt: { type: Date, default: Date.now },
                    refreshToken: String,
                },
                required: false,
            },
            github: {
                type: {
                    id: { type: String, required: true },
                    username: String,
                    linkedAt: { type: Date, default: Date.now },
                    accessToken: String,
                },
                required: false,
            },
            linkedin: {
                type: {
                    id: { type: String, required: true },
                    linkedAt: { type: Date, default: Date.now },
                    accessToken: String,
                },
                required: false,
            },
        },
        default: {},
    },
    role: {
        type: String,
        enum: Object.values(types_1.UserRole),
        required: [true, 'Role is required'],
    },
    status: {
        type: String,
        enum: Object.values(types_1.UserStatus),
        default: types_1.UserStatus.ACTIVE,
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    phone: {
        type: String,
        trim: true,
    },
    avatar: {
        type: String,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    lastLogin: {
        type: Date,
    },
    refreshTokens: [{
            type: String,
        }],
    passwordResetToken: {
        type: String,
        select: false,
    },
    passwordResetExpires: {
        type: Date,
        select: false,
    },
    failedLoginAttempts: {
        type: Number,
        default: 0,
    },
    accountLockedUntil: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    toJSON: {
        transform: (_, ret) => {
            const transformed = ret;
            delete transformed.password;
            delete transformed.refreshTokens;
            delete transformed.__v;
            return transformed;
        },
    },
});
// Indexes (email index is already created by unique: true)
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'authProviders.google.id': 1 }, { sparse: true });
userSchema.index({ 'authProviders.github.id': 1 }, { sparse: true });
userSchema.index({ 'authProviders.linkedin.id': 1 }, { sparse: true });
// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    try {
        const salt = await bcryptjs_1.default.genSalt(12);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcryptjs_1.default.compare(candidatePassword, this.password);
    }
    catch {
        return false;
    }
};
// Generate access token
userSchema.methods.generateAuthToken = function () {
    return jsonwebtoken_1.default.sign({
        id: this._id,
        email: this.email,
        role: this.role,
    }, config_1.default.jwt.secret, { expiresIn: config_1.default.jwt.expiresIn });
};
// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
    return jsonwebtoken_1.default.sign({
        id: this._id,
        email: this.email,
        role: this.role,
    }, config_1.default.jwt.refreshSecret, { expiresIn: config_1.default.jwt.refreshExpiresIn });
};
// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = jsonwebtoken_1.default.sign({ id: this._id }, config_1.default.jwt.secret + this.password, { expiresIn: '1h' });
    this.passwordResetToken = resetToken;
    this.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    return resetToken;
};
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
//# sourceMappingURL=User%202.js.map