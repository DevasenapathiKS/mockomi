import mongoose, { Schema, Document, Types } from 'mongoose';
import { IWithdrawal, WithdrawalStatus, WithdrawalMethod } from '../types';

export interface IWithdrawalDocument extends Omit<IWithdrawal, '_id' | 'userId'>, Document {
  userId: Types.ObjectId;
}

const withdrawalSchema = new Schema<IWithdrawalDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
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
      enum: Object.values(WithdrawalMethod),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(WithdrawalStatus),
      default: WithdrawalStatus.PENDING,
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
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        const transformed = ret as Record<string, unknown>;
        delete transformed.__v;
        // Mask sensitive data
        if (transformed.bankDetails) {
          const bd = transformed.bankDetails as Record<string, string>;
          if (bd.accountNumber && bd.accountNumber.length > 4) {
            bd.accountNumber = '****' + bd.accountNumber.slice(-4);
          }
        }
        return transformed;
      },
    },
  }
);

// Indexes
withdrawalSchema.index({ userId: 1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ createdAt: -1 });
withdrawalSchema.index({ razorpayPayoutId: 1 });

// Compound indexes
withdrawalSchema.index({ userId: 1, status: 1 });
withdrawalSchema.index({ userId: 1, createdAt: -1 });

const Withdrawal = mongoose.model<IWithdrawalDocument>('Withdrawal', withdrawalSchema);

export default Withdrawal;

