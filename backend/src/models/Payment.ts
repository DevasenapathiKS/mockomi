import mongoose, { Schema, Document, Types } from 'mongoose';
import { IPayment, PaymentStatus } from '../types';

export interface IPaymentDocument extends Omit<IPayment, '_id' | 'userId' | 'interviewId'>, Document {
  userId: Types.ObjectId;
  interviewId?: Types.ObjectId;
}

const paymentSchema = new Schema<IPaymentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    receipt: {
      type: String,
      required: true,
    },
    notes: {
      type: Schema.Types.Mixed,
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

// Indexes (orderId index is already created by unique: true)
paymentSchema.index({ userId: 1 });
paymentSchema.index({ interviewId: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Compound indexes
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });

const Payment = mongoose.model<IPaymentDocument>('Payment', paymentSchema);

export default Payment;
