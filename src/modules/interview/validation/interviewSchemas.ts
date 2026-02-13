import { z } from 'zod';

export const startInterviewSchema = z.object({
  candidateId: z.string().min(1),
  roleProfileId: z.string().min(1),
  level: z.enum(['confidence', 'guided', 'simulation', 'stress']),
});

export const completeInterviewSchema = z.object({
  sectionScores: z.array(
    z.object({
      sectionId: z.string().min(1),
      rawScore: z.number().min(0).max(10),
    }),
  ),
});

