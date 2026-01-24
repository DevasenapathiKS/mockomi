import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICouponDocument extends Document {
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  perUserLimit: number;
  globalLimit?: number;
  totalUsed: number;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICouponDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'percentage',
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    perUserLimit: {
      type: Number,
      required: true,
      min: 1,
    },
    globalLimit: {
      type: Number,
      min: 1,
    },
    totalUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        const transformed = ret as Record<string, unknown>;
        delete transformed.__v;
        return transformed;
      },
    },
  }
);

// Indexes
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ expiresAt: 1 });

const Coupon = mongoose.model<ICouponDocument>('Coupon', couponSchema);

export default Coupon;
