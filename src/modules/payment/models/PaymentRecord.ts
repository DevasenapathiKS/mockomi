import { Schema, model, models, Types, type Model } from 'mongoose';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IPaymentRecord {
  candidateId: Types.ObjectId;
  interviewerId: Types.ObjectId;
  slotId: Types.ObjectId;
  sessionId?: Types.ObjectId;
  amountTotal: number;
  platformShare: number;
  interviewerShare: number;
  status: PaymentStatus;
  paymentProvider: string;
  providerOrderId?: string;
  providerReferenceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PaymentRecordSchema = new Schema<IPaymentRecord>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    interviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    slotId: {
      type: Schema.Types.ObjectId,
      ref: 'AvailabilitySlot',
      required: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      unique: true,
    },
    amountTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    platformShare: {
      type: Number,
      required: true,
      min: 0,
    },
    interviewerShare: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentProvider: {
      type: String,
      default: 'mock',
    },
    providerOrderId: {
      type: String,
    },
    providerReferenceId: {
      type: String,
    },
  },
  { timestamps: true },
);

PaymentRecordSchema.index(
  { sessionId: 1 },
  { unique: true, sparse: true },
);
PaymentRecordSchema.index(
  { paymentProvider: 1, providerOrderId: 1 },
  { unique: true, sparse: true },
);
PaymentRecordSchema.index({ candidateId: 1 });
PaymentRecordSchema.index({ interviewerId: 1 });
PaymentRecordSchema.index({ status: 1 });

const MODEL_NAME = 'PaymentRecord';
const existingModel = models[MODEL_NAME] as Model<IPaymentRecord> | undefined;

export const PaymentRecord =
  existingModel ?? model<IPaymentRecord>(MODEL_NAME, PaymentRecordSchema);

