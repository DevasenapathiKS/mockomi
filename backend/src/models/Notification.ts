import mongoose, { Schema, Document, Types } from 'mongoose';
import { INotification } from '../types';

export interface INotificationDocument extends Omit<INotification, '_id' | 'userId'>, Document {
  userId: Types.ObjectId;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'interview_scheduled',
        'interview_reminder',
        'interview_completed',
        'interview_cancelled',
        'feedback_received',
        'application_received',
        'application_reviewed',
        'application_shortlisted',
        'application_rejected',
        'job_posted',
        'payment_success',
        'payment_failed',
        'profile_verified',
        'interviewer_approved',
        'interviewer_rejected',
        'new_interview_request',
        'withdrawal_processing',
        'withdrawal_success',
        'withdrawal_failed',
        'withdrawal_reversed',
        'system',
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
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
notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });

// Compound indexes
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

// TTL index to auto-delete old notifications (90 days)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Notification = mongoose.model<INotificationDocument>(
  'Notification',
  notificationSchema
);

export default Notification;
