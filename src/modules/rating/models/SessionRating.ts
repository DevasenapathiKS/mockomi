import { Schema, model, models, Types, type Model } from 'mongoose';

export interface ISessionRating {
  sessionId: Types.ObjectId;
  candidateId: Types.ObjectId;
  interviewerId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SessionRatingSchema = new Schema<ISessionRating>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true,
      unique: true,
    },
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: (value: number) => Number.isInteger(value),
        message: 'rating must be an integer',
      },
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

SessionRatingSchema.index({ sessionId: 1 }, { unique: true });
SessionRatingSchema.index({ interviewerId: 1 });
SessionRatingSchema.index({ candidateId: 1 });

const MODEL_NAME = 'SessionRating';
const existingModel = models[MODEL_NAME] as Model<ISessionRating> | undefined;

export const SessionRating =
  existingModel ?? model<ISessionRating>(MODEL_NAME, SessionRatingSchema);

