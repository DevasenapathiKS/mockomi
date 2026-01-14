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
const withdrawalSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 100, // Minimum 100 paise (₹1)
    },
    currency: {
        type: String,
        required: true,
        default: 'INR',
    },
    method: {
        type: String,
        enum: Object.values(types_1.WithdrawalMethod),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(types_1.WithdrawalStatus),
        default: types_1.WithdrawalStatus.PENDING,
    },
    bankDetails: {
        accountHolderName: { type: String },
        accountNumber: { type: String },
        ifscCode: { type: String },
        bankName: { type: String },
    },
    upiId: {
        type: String,
    },
    razorpayPayoutId: {
        type: String,
    },
    razorpayFundAccountId: {
        type: String,
    },
    razorpayContactId: {
        type: String,
    },
    failureReason: {
        type: String,
    },
    processedAt: {
        type: Date,
    },
}, {
    timestamps: true,
    toJSON: {
        transform: (_, ret) => {
            const transformed = ret;
            delete transformed.__v;
            // Mask sensitive data
            if (transformed.bankDetails) {
                const bd = transformed.bankDetails;
                if (bd.accountNumber && bd.accountNumber.length > 4) {
                    bd.accountNumber = '****' + bd.accountNumber.slice(-4);
                }
            }
            return transformed;
        },
    },
});
// Indexes
withdrawalSchema.index({ userId: 1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ createdAt: -1 });
withdrawalSchema.index({ razorpayPayoutId: 1 });
// Compound indexes
withdrawalSchema.index({ userId: 1, status: 1 });
withdrawalSchema.index({ userId: 1, createdAt: -1 });
const Withdrawal = mongoose_1.default.model('Withdrawal', withdrawalSchema);
exports.default = Withdrawal;
//# sourceMappingURL=Withdrawal.js.map