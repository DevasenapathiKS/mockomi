import { Schema, model, models, type Model } from 'mongoose';

export interface ISectionDefinition {
  key: string;
  label: string;
  description?: string;
  isActive: boolean;
}

const SectionDefinitionSchema = new Schema<ISectionDefinition>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// SectionDefinitionSchema.index({ key: 1 }, { unique: true });
SectionDefinitionSchema.index({ isActive: 1 });

const MODEL_NAME = 'SectionDefinition';
const existingModel = models[MODEL_NAME] as Model<ISectionDefinition> | undefined;

export const SectionDefinition =
  existingModel ?? model<ISectionDefinition>(MODEL_NAME, SectionDefinitionSchema);

