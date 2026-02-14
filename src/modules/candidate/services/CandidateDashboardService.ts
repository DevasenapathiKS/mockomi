import { Types } from 'mongoose';

import { AppError } from '../../../core/error';
import { CandidateProgress } from '../../progress/models/CandidateProgress';
import { InterviewSession } from '../../interview/models/InterviewSession';
import { SectionScore } from '../../interview/models/SectionScore';
import { SectionDefinition } from '../../scoring/models/SectionDefinition';

export type MotivationTier = 'foundation' | 'approaching_readiness' | 'ready';

export type CandidateDashboardMotivation = {
  tier: MotivationTier;
  message: string;
};

export type CandidateDashboardPerformance = {
  readinessScore: number;
  improvementDelta: number;
  totalSessions: number;
  averageScore: number;
  latestScore: number;
};

export type CandidateDashboardTrendPoint = {
  date: string;
  score: number;
};

export type CandidateDashboardWeakestSection =
  | null
  | {
      sectionId: string;
      label: string;
      rawScore: number;
      weightedScore: number;
    };

export type CandidateDashboardRecentSession = {
  id: string;
  scheduledAt: string | null;
  interviewerId: string | null;
  overallScore: number;
  status: string;
};

export type CandidateDashboard = {
  motivation: CandidateDashboardMotivation;
  performance: CandidateDashboardPerformance;
  trend: CandidateDashboardTrendPoint[];
  weakestSection: CandidateDashboardWeakestSection;
  recentSessions: CandidateDashboardRecentSession[];
};

function motivationFromReadiness(readinessScore: number): CandidateDashboardMotivation {
  if (readinessScore < 60) {
    return {
      tier: 'foundation',
      message: "Clarity starts with awareness. You're building your foundation.",
    };
  }

  if (readinessScore <= 75) {
    return {
      tier: 'approaching_readiness',
      message: "You're getting closer. Stay consistent.",
    };
  }

  return {
    tier: 'ready',
    message: "You're interview ready. Let's sharpen it further.",
  };
}

export class CandidateDashboardService {
  public async getDashboard(candidateId: string): Promise<CandidateDashboard> {
    if (!candidateId || candidateId.trim().length === 0) {
      throw new AppError('Invalid candidateId', 400);
    }

    const last5CompletedSessions = await InterviewSession.find({
      candidateId,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id roleProfileId interviewerId scheduledAt overallScore status createdAt')
      .lean()
      .exec();

    const trend: CandidateDashboardTrendPoint[] = last5CompletedSessions.map((s) => ({
      date: (s.createdAt as Date).toISOString(),
      score: Number(s.overallScore ?? 0),
    }));

    const progress = await CandidateProgress.findOne({ candidateId })
      .sort({ lastUpdated: -1, updatedAt: -1, createdAt: -1 })
      .lean()
      .exec();

    const performance: CandidateDashboardPerformance = {
      readinessScore: Number(progress?.latestScore ?? 0),
      improvementDelta: Number(progress?.improvementDelta ?? 0),
      totalSessions: Number(progress?.totalSessions ?? 0),
      averageScore: Number(progress?.averageScore ?? 0),
      latestScore: Number(progress?.latestScore ?? 0),
    };

    const motivation = motivationFromReadiness(performance.readinessScore);

    const recent = await InterviewSession.find({ candidateId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id scheduledAt interviewerId overallScore status')
      .lean()
      .exec();

    const recentSessions: CandidateDashboardRecentSession[] = recent.map((s) => ({
      id: String(s._id),
      scheduledAt: s.scheduledAt ? (s.scheduledAt as Date).toISOString() : null,
      interviewerId: s.interviewerId ? String(s.interviewerId) : null,
      overallScore: Number(s.overallScore ?? 0),
      status: String(s.status),
    }));

    const latestCompleted = last5CompletedSessions[0] ?? null;

    const weakestSection = await (async (): Promise<CandidateDashboardWeakestSection> => {
      if (!latestCompleted) return null;

      const sessionId = String(latestCompleted._id);
      if (!Types.ObjectId.isValid(sessionId)) return null;

      const weakest = await SectionScore.findOne({
        sessionId: new Types.ObjectId(sessionId),
      })
        .sort({ weightedScore: 1 })
        .lean()
        .exec();

      if (!weakest) return null;

      const sectionId = String(weakest.sectionId);
      const section = Types.ObjectId.isValid(sectionId)
        ? await SectionDefinition.findById(sectionId).select('label').lean().exec()
        : null;

      return {
        sectionId,
        label: section?.label ?? 'Section',
        rawScore: Number(weakest.rawScore ?? 0),
        weightedScore: Number(weakest.weightedScore ?? 0),
      };
    })();

    return {
      motivation,
      performance,
      trend,
      weakestSection,
      recentSessions,
    };
  }
}

