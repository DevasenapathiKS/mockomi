import { Schema, model, models, Types, type Model } from 'mongoose';

export type ExperienceLevel = 'fresher' | 'junior' | 'mid' | 'senior';

export interface IRoleProfileSection {
  sectionId: Types.ObjectId;
  weight: number;
}

export interface IRoleProfile {
  name: string;
  experienceLevel: ExperienceLevel;
  sections: IRoleProfileSection[];
  readinessThreshold: number;
  confidenceBuffer: number;
  isActive: boolean;
}

const RoleProfileSectionSchema = new Schema<IRoleProfileSection>(
  {
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'SectionDefinition',
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      validate: {
        validator: (value: number) => value > 0,
        message: 'Section weight must be greater than 0',
      },
    },
  },
  { _id: false },
);

const RoleProfileSchema = new Schema<IRoleProfile>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    experienceLevel: {
      type: String,
      required: true,
      enum: ['fresher', 'junior', 'mid', 'senior'],
    },
    sections: {
      type: [RoleProfileSectionSchema],
      required: true,
      validate: [
        {
          validator: (sections: IRoleProfileSection[]) => sections.length > 0,
          message: 'Role profile must have at least one section.',
        },
        {
          validator: (sections: IRoleProfileSection[]) => {
            const ids = sections.map((s) => String(s.sectionId));
            return new Set(ids).size === ids.length;
          },
          message: 'Duplicate sectionId found in role profile.',
        },
        {
          validator: (sections: IRoleProfileSection[]) => {
            const totalWeight = sections.reduce((sum, s) => sum + s.weight, 0);
            return totalWeight === 100;
          },
          message: 'Sum of section weights must equal 100',
        },
      ],
    },
    readinessThreshold: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    confidenceBuffer: {
      type: Number,
      default: 5,
      min: 0,
      max: 20
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

RoleProfileSchema.index({ name: 1 });
RoleProfileSchema.index({ experienceLevel: 1 });
RoleProfileSchema.index({ isActive: 1 });

const MODEL_NAME = 'RoleProfile';
const existingModel = models[MODEL_NAME] as Model<IRoleProfile> | undefined;

export const RoleProfile =
  existingModel ?? model<IRoleProfile>(MODEL_NAME, RoleProfileSchema);

