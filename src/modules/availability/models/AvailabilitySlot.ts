import { Schema, model, models, Types, type Model } from 'mongoose';

export type AvailabilitySlotStatus =
  | 'available'
  | 'reserved'
  | 'completed'
  | 'cancelled';

export interface IAvailabilitySlot {
  interviewerId: Types.ObjectId;
  roleProfileId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: AvailabilitySlotStatus;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

const AvailabilitySlotSchema = new Schema<IAvailabilitySlot>(
  {
    interviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roleProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'RoleProfile',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      validate: {
        validator: (value: Date) => value.getTime() > Date.now(),
        message: 'startTime must be in the future',
      },
    },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: unknown, value: Date) {
          const startTime = (this as { startTime?: Date }).startTime;
          if (!startTime) return false;
          return value.getTime() - startTime.getTime() === THIRTY_MINUTES_MS;
        },
        message: 'endTime must be exactly 30 minutes after startTime',
      },
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'completed', 'cancelled'],
      default: 'available',
    },
    price: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
    },
  },
  { timestamps: true },
);

AvailabilitySlotSchema.index({ interviewerId: 1 });
AvailabilitySlotSchema.index({ roleProfileId: 1 });
AvailabilitySlotSchema.index({ startTime: 1 });
AvailabilitySlotSchema.index({ status: 1 });
AvailabilitySlotSchema.index({ interviewerId: 1, startTime: 1 });

const MODEL_NAME = 'AvailabilitySlot';
const existingModel =
  models[MODEL_NAME] as Model<IAvailabilitySlot> | undefined;

export const AvailabilitySlot =
  existingModel ?? model<IAvailabilitySlot>(MODEL_NAME, AvailabilitySlotSchema);

