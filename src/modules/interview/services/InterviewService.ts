import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { InterviewSession } from '../models/InterviewSession';
import { SectionScore } from '../models/SectionScore';

import { RoleProfile } from '../../scoring/models/RoleProfile';
import { ScoringModel } from '../../scoring/models/ScoringModel';
import { ScoringService, type DifficultyLevel } from '../../scoring/services/ScoringService';
import { ProgressService } from "../../progress/services/ProgressService";

import { AppError } from '../../../core/error';
import { config } from '../../../config/env';

type StartInterviewInput = {
  candidateId: string;
  roleProfileId: string;
  level: DifficultyLevel;
};

type CompleteInterviewInput = {
  sessionId: string;
  sectionScores: Array<{ sectionId: string; rawScore: number }>;
};

type SectionBreakdownItem = {
  sectionId: string;
  rawScore: number;
  weightedScore: number;
  classification: 'strong' | 'moderate' | 'needs_improvement';
};

type InterviewInsights = {
  strongestSection: SectionBreakdownItem | null;
  weakestSection: SectionBreakdownItem | null;
  sectionBreakdown: SectionBreakdownItem[];
};

type ActionPlan =
  | null
  | {
    confidenceTarget: number;
    recommendedFocusSection: string;
    currentRawScore: number;
    recommendedRawScore: number;
  }
  | {
    confidenceTarget: number;
    message: string;
  };

type PerformanceTier =
  | 'developing'
  | 'approaching_readiness'
  | 'interview_ready'
  | 'strong_candidate'
  | 'elite';

function computePerformanceTier(score: number): PerformanceTier {
  if (score >= 90) return 'elite';
  if (score >= 80) return 'strong_candidate';
  if (score >= 70) return 'interview_ready';
  if (score >= 60) return 'approaching_readiness';
  return 'developing';
}

type CompleteInterviewResult = {
  overallScore: number;
  readinessScore: number;
  readinessStatus: 'ready' | 'not_ready';
  readinessGap: number;
  performanceTier: PerformanceTier;
  insights: InterviewInsights;
  actionPlan: ActionPlan;
};

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

export class InterviewService {
  private readonly scoringService: ScoringService;
  private progressService: ProgressService;

  constructor() {
    this.scoringService = new ScoringService();
    this.progressService = new ProgressService();
  }

  public async startInterview(input: StartInterviewInput) {
    const mongoSession = await mongoose.startSession();

    try {
      let createdSession: unknown;

      await mongoSession.withTransaction(async () => {
        const activeScoringModel = await ScoringModel.findOne({ isActive: true })
          .sort({ version: -1 })
          .session(mongoSession)
          .exec();

        if (!activeScoringModel) {
          throw new AppError('Active scoring model not found', 400);
        }

        const now = new Date();
        const startOfDay = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            0,
            0,
            0,
            0,
          ),
        );

        const endOfDay = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23,
            59,
            59,
            999,
          ),
        );

        const todayCount = await InterviewSession.countDocuments({
          candidateId: input.candidateId,
          status: 'completed',
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        })
          .session(mongoSession)
          .exec();

        if (todayCount >= config.dailyInterviewLimit) {
          throw new AppError(
            `Daily interview limit of ${config.dailyInterviewLimit} reached.`,
            429,
          );
        }

        const [session] = await InterviewSession.create(
          [
            {
              candidateId: input.candidateId,
              roleProfileId: new Types.ObjectId(input.roleProfileId),
              scoringModelVersion: activeScoringModel.version,
              level: input.level,
              status: 'in_progress',
            },
          ],
          { session: mongoSession },
        );

        createdSession = session;
      });

      return createdSession as typeof InterviewSession.prototype;
    } finally {
      await mongoSession.endSession();
    }
  }

  public async completeInterview(
    input: CompleteInterviewInput
  ): Promise<CompleteInterviewResult> {
    const mongoSession = await mongoose.startSession();
  
    try {
      let result!: CompleteInterviewResult;
  
      await mongoSession.withTransaction(async () => {
  
        const session = await InterviewSession.findById(input.sessionId)
          .session(mongoSession)
          .exec();
  
        if (!session) {
          throw new AppError("Session not found", 404);
        }
  
        if (session.status !== "in_progress") {
          throw new AppError("Session already completed or invalid", 400);
        }
  
        const roleProfile = await RoleProfile.findById(session.roleProfileId)
          .session(mongoSession)
          .exec();
  
        if (!roleProfile) {
          throw new AppError("Role profile not found", 404);
        }
  
        const scoringModel = await ScoringModel.findOne({
          version: session.scoringModelVersion,
        })
          .session(mongoSession)
          .exec();
  
        if (!scoringModel) {
          throw new AppError("Scoring model not found", 404);
        }
  
        const scoreBySectionId = new Map<string, number>(
          input.sectionScores.map((s) => [s.sectionId, s.rawScore])
        );
  
        const breakdown: SectionBreakdownItem[] = [];
  
        const sectionScoreDocs = roleProfile.sections.map((section) => {
          const sectionId = String(section.sectionId);
          const rawScore = scoreBySectionId.get(sectionId) ?? 0;
          const percentScore = rawScore * 10;
          const weightedScore = roundTo2(percentScore * (section.weight / 100));
  
          let classification: "strong" | "moderate" | "needs_improvement";
  
          if (rawScore >= 8) {
            classification = "strong";
          } else if (rawScore >= 6) {
            classification = "moderate";
          } else {
            classification = "needs_improvement";
          }
  
          breakdown.push({
            sectionId,
            rawScore,
            weightedScore,
            classification,
          });
  
          return {
            sessionId: session._id,
            sectionId: section.sectionId,
            rawScore,
            weightedScore,
          };
        });
  
        await SectionScore.insertMany(sectionScoreDocs, {
          session: mongoSession,
        });
  
        const finalResult = this.scoringService.computeFinalResult(
          input.sectionScores,
          {
            sections: roleProfile.sections.map((s) => ({
              sectionId: String(s.sectionId),
              weight: s.weight,
            })),
            readinessThreshold: roleProfile.readinessThreshold,
          },
          session.level,
          {
            difficultyMultipliers: scoringModel.difficultyMultipliers,
          }
        );
  
        session.overallScore = roundTo2(finalResult.overallScore);
        session.readinessScore = roundTo2(finalResult.readinessScore);
        session.readinessStatus = finalResult.readinessStatus;
        session.readinessGap = roundTo2(finalResult.readinessGap);
        session.status = "completed";
  
        await session.save({ session: mongoSession });
  
        await this.progressService.updateProgress(
          session.candidateId,
          session.roleProfileId.toString(),
          session.overallScore
        );
  
        const performanceTier = computePerformanceTier(session.overallScore);
  
        breakdown.sort((a, b) => b.weightedScore - a.weightedScore);
  
        const strongestSection = breakdown.length > 0 ? breakdown[0] : null;
        const weakestSection =
          breakdown.length > 0 ? breakdown[breakdown.length - 1] : null;
  
        const confidenceTarget =
          roleProfile.readinessThreshold + roleProfile.confidenceBuffer;
  
        let actionPlan: ActionPlan = null;
  
        if (session.readinessStatus === "not_ready" && weakestSection) {
          const weightedGap = roundTo2(confidenceTarget - session.overallScore);
  
          const weakestWeight =
            roleProfile.sections.find(
              (s) => String(s.sectionId) === weakestSection.sectionId
            )?.weight ?? 0;
  
          if (weakestWeight > 0) {
            const requiredPercentIncrease =
              weightedGap / (weakestWeight / 100);
  
            const requiredRawIncrease = requiredPercentIncrease / 10;
  
            const recommendedRawScore = Math.ceil(
              weakestSection.rawScore + requiredRawIncrease
            );
  
            actionPlan = {
              confidenceTarget,
              recommendedFocusSection: weakestSection.sectionId,
              currentRawScore: weakestSection.rawScore,
              recommendedRawScore,
            };
          }
        } else {
          actionPlan = {
            confidenceTarget,
            message:
              "You have crossed readiness. Aim to maintain consistency.",
          };
        }
  
        result = {
          overallScore: session.overallScore,
          readinessScore: session.readinessScore,
          readinessStatus:
            session.readinessStatus ?? "not_ready",
          readinessGap: session.readinessGap,
          performanceTier,
          insights: {
            strongestSection,
            weakestSection,
            sectionBreakdown: breakdown,
          },
          actionPlan,
        };
      });
  
      return result;
  
    } finally {
      mongoSession.endSession();
    }
  }

  public async getInterviewHistory(
    candidateId: string,
    page: number,
    limit: number,
  ): Promise<{
    items: Array<{
      id: string;
      overallScore: number;
      readinessStatus: 'ready' | 'not_ready' | null;
      readinessGap: number;
      performanceTier: PerformanceTier;
      level: DifficultyLevel;
      createdAt: Date;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      InterviewSession.find({
        candidateId,
        status: 'completed',
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('_id overallScore readinessStatus readinessGap level createdAt')
        .lean()
        .exec(),
      InterviewSession.countDocuments({
        candidateId,
        status: 'completed',
      }).exec(),
    ]);

    return {
      items: items.map((item) => ({
        id: String(item._id),
        overallScore: item.overallScore,
        readinessStatus: item.readinessStatus ?? null,
        readinessGap: item.readinessGap,
        performanceTier: computePerformanceTier(item.overallScore),
        level: item.level as DifficultyLevel,
        createdAt: item.createdAt as Date,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async getCandidateSessionsList(
    candidateId: string,
    page: number,
    limit: number,
  ): Promise<{
    items: Array<{
      id: string;
      status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
      scheduledAt: Date | null;
      overallScore: number;
      readinessScore: number;
      readinessStatus: 'ready' | 'not_ready' | null;
      readinessGap: number;
      performanceTier: PerformanceTier;
      level: DifficultyLevel;
      createdAt: Date;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const filter = { candidateId };

    const [items, total] = await Promise.all([
      InterviewSession.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          '_id status scheduledAt overallScore readinessScore readinessStatus readinessGap level createdAt',
        )
        .lean()
        .exec(),
      InterviewSession.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item: any) => ({
        id: String(item._id),
        status: item.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
        scheduledAt: (item.scheduledAt as Date | undefined) ?? null,
        overallScore: Number(item.overallScore ?? 0),
        readinessScore: Number(item.readinessScore ?? 0),
        readinessStatus: (item.readinessStatus ?? null) as 'ready' | 'not_ready' | null,
        readinessGap: Number(item.readinessGap ?? 0),
        performanceTier: computePerformanceTier(Number(item.overallScore ?? 0)),
        level: item.level as DifficultyLevel,
        createdAt: item.createdAt as Date,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  
}

