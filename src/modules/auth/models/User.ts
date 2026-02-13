import { Schema, model, models, type Model } from 'mongoose';

export type UserRole = 'candidate' | 'interviewer' | 'admin';

export interface IUser {
  email: string;
  password: string;
  role: UserRole;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['candidate', 'interviewer', 'admin'],
      default: 'candidate',
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.index({ email: 1 }, { unique: true });

const MODEL_NAME = 'User';
const existingModel = models[MODEL_NAME] as Model<IUser> | undefined;

export const User = existingModel ?? model<IUser>(MODEL_NAME, UserSchema);

