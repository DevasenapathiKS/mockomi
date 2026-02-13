import { Schema, model, models, type Model } from 'mongoose';

export interface IDifficultyMultipliers {
  confidence: number;
  guided: number;
  simulation: number;
  stress: number;
}

export interface IScoringModel {
  version: number;
  difficultyMultipliers: IDifficultyMultipliers;
  isActive: boolean;
}

const PositiveNumber = {
  type: Number,
  required: true,
  validate: {
    validator: (value: number) => value > 0,
    message: 'Value must be greater than 0',
  },
} as const;

const DifficultyMultipliersSchema = new Schema<IDifficultyMultipliers>(
  {
    confidence: PositiveNumber,
    guided: PositiveNumber,
    simulation: PositiveNumber,
    stress: PositiveNumber,
  },
  { _id: false },
);

const ScoringModelSchema = new Schema<IScoringModel>(
  {
    version: {
      type: Number,
      required: true,
      unique: true,
      validate: {
        validator: (value: number) => value > 0,
        message: 'Version must be a positive number',
      },
    },
    difficultyMultipliers: {
      type: DifficultyMultipliersSchema,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// ScoringModelSchema.index({ version: 1 }, { unique: true });
ScoringModelSchema.index({ isActive: 1 });

const MODEL_NAME = 'ScoringModel';
const existingModel = models[MODEL_NAME] as Model<IScoringModel> | undefined;

export const ScoringModel =
  existingModel ?? model<IScoringModel>(MODEL_NAME, ScoringModelSchema);

