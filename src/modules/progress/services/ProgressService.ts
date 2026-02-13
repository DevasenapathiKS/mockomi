import { Types } from 'mongoose';

import { CandidateProgress } from '../models/CandidateProgress';
import { AppError } from '../../../core/error';

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

export class ProgressService {
  public async updateProgress(
    candidateId: string,
    roleProfileId: string,
    newScore: number,
  ) {
    if (!Types.ObjectId.isValid(roleProfileId)) {
      throw new AppError('Invalid roleProfileId', 400);
    }

    const roleProfileObjectId = new Types.ObjectId(roleProfileId);

    const existing = await CandidateProgress.findOne({
      candidateId,
      roleProfileId: roleProfileObjectId,
    }).exec();

    const scoreRounded = roundTo2(newScore);

    if (!existing) {
      const created = await CandidateProgress.create({
        candidateId,
        roleProfileId: roleProfileObjectId,
        totalSessions: 1,
        averageScore: scoreRounded,
        latestScore: scoreRounded,
        previousScore: 0,
        improvementDelta: scoreRounded,
        lastUpdated: new Date(),
      });

      return created;
    }

    const newTotalSessions = existing.totalSessions + 1;
    const previousScore = existing.latestScore;
    const latestScore = scoreRounded;

    existing.totalSessions = newTotalSessions;
    existing.previousScore = previousScore;
    existing.latestScore = latestScore;
    existing.improvementDelta = roundTo2(latestScore - previousScore);
    existing.averageScore = roundTo2(
      (existing.averageScore * (newTotalSessions - 1) + newScore) /
        newTotalSessions,
    );
    existing.lastUpdated = new Date();

    await existing.save();
    return existing;
  }
}

