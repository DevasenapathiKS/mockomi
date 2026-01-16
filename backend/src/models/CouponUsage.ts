import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICouponUsageDocument extends Document {
  userId: Types.ObjectId;
  couponId: Types.ObjectId;
  usageCount: number;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const couponUsageSchema = new Schema<ICouponUsageDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUsedAt: {
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

// Compound unique index to ensure one record per user-coupon pair
couponUsageSchema.index({ userId: 1, couponId: 1 }, { unique: true });
couponUsageSchema.index({ userId: 1 });
couponUsageSchema.index({ couponId: 1 });

const CouponUsage = mongoose.model<ICouponUsageDocument>('CouponUsage', couponUsageSchema);

export default CouponUsage;
