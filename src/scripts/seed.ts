import process from 'node:process';

import mongoose from 'mongoose';

import { connectDatabase } from '../config/database';
import { config } from '../config/env';
import { logger } from '../core/logger';

import { SectionDefinition } from '../modules/scoring/models/SectionDefinition';
import { ScoringModel } from '../modules/scoring/models/ScoringModel';
import { RoleProfile } from '../modules/scoring/models/RoleProfile';
import { InterviewSession } from '../modules/interview/models/InterviewSession';
import { SectionScore } from '../modules/interview/models/SectionScore';

async function seed(): Promise<void> {
  if (config.nodeEnv !== 'development') {
    throw new Error('Seeding is only allowed in development environment');
  }

  await connectDatabase();

  await Promise.all([
    SectionDefinition.deleteMany({}),
    ScoringModel.deleteMany({}),
    RoleProfile.deleteMany({}),
    InterviewSession.deleteMany({}),
    SectionScore.deleteMany({}),
  ]);

  const [technical, communication] = await SectionDefinition.create([
    {
      key: 'technical',
      label: 'Technical',
      description: 'Technical skills and problem solving',
      isActive: true,
    },
    {
      key: 'communication',
      label: 'Communication',
      description: 'Communication and clarity',
      isActive: true,
    },
  ]);

  await ScoringModel.create({
    version: 1,
    difficultyMultipliers: {
      confidence: 1.0,
      guided: 1.05,
      simulation: 1.1,
      stress: 1.15,
    },
    isActive: true,
  });

  await RoleProfile.create({
    name: 'Backend Junior',
    experienceLevel: 'junior',
    sections: [
      { sectionId: technical._id, weight: 60 },
      { sectionId: communication._id, weight: 40 },
    ],
    readinessThreshold: 70,
    isActive: true,
  });

  logger.info('Seed completed successfully');
}

void seed()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    logger.error({ error }, 'Seed failed');
    await mongoose.disconnect();
    process.exit(1);
  });

