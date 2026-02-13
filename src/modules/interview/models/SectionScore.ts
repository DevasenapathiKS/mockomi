import { Schema, model, models, Types, type Model } from 'mongoose';

export interface ISectionScore {
  sessionId: Types.ObjectId;
  sectionId: Types.ObjectId;
  rawScore: number;
  weightedScore: number;
}

const SectionScoreSchema = new Schema<ISectionScore>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'SectionDefinition',
      required: true,
    },
    rawScore: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    weightedScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  },
);

SectionScoreSchema.index({ sessionId: 1 });
SectionScoreSchema.index({ sectionId: 1 });

const MODEL_NAME = 'SectionScore';
const existingModel = models[MODEL_NAME] as Model<ISectionScore> | undefined;

export const SectionScore =
  existingModel ?? model<ISectionScore>(MODEL_NAME, SectionScoreSchema);

