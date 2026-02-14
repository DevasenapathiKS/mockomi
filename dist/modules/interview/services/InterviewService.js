"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewService = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const InterviewSession_1 = require("../models/InterviewSession");
const SectionScore_1 = require("../models/SectionScore");
const RoleProfile_1 = require("../../scoring/models/RoleProfile");
const ScoringModel_1 = require("../../scoring/models/ScoringModel");
const ScoringService_1 = require("../../scoring/services/ScoringService");
const ProgressService_1 = require("../../progress/services/ProgressService");
const User_1 = require("../../auth/models/User");
const error_1 = require("../../../core/error");
const env_1 = require("../../../config/env");
function computePerformanceTier(score) {
    if (score >= 90)
        return 'elite';
    if (score >= 80)
        return 'strong_candidate';
    if (score >= 70)
        return 'interview_ready';
    if (score >= 60)
        return 'approaching_readiness';
    return 'developing';
}
function roundTo2(value) {
    return Math.round(value * 100) / 100;
}
class InterviewService {
    constructor() {
        this.scoringService = new ScoringService_1.ScoringService();
        this.progressService = new ProgressService_1.ProgressService();
    }
    async startInterview(input) {
        const mongoSession = await mongoose_2.default.startSession();
        try {
            let createdSession;
            await mongoSession.withTransaction(async () => {
                const activeScoringModel = await ScoringModel_1.ScoringModel.findOne({ isActive: true })
                    .sort({ version: -1 })
                    .session(mongoSession)
                    .exec();
                if (!activeScoringModel) {
                    throw new error_1.AppError('Active scoring model not found', 400);
                }
                const now = new Date();
                const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
                const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
                const todayCount = await InterviewSession_1.InterviewSession.countDocuments({
                    candidateId: input.candidateId,
                    status: 'completed',
                    createdAt: { $gte: startOfDay, $lte: endOfDay },
                })
                    .session(mongoSession)
                    .exec();
                if (todayCount >= env_1.config.dailyInterviewLimit) {
                    throw new error_1.AppError(`Daily interview limit of ${env_1.config.dailyInterviewLimit} reached.`, 429);
                }
                const [session] = await InterviewSession_1.InterviewSession.create([
                    {
                        candidateId: input.candidateId,
                        roleProfileId: new mongoose_1.Types.ObjectId(input.roleProfileId),
                        scoringModelVersion: activeScoringModel.version,
                        level: input.level,
                        status: 'in_progress',
                    },
                ], { session: mongoSession });
                createdSession = session;
            });
            return createdSession;
        }
        finally {
            await mongoSession.endSession();
        }
    }
    async completeInterview(input) {
        const mongoSession = await mongoose_2.default.startSession();
        try {
            let result;
            await mongoSession.withTransaction(async () => {
                const session = await InterviewSession_1.InterviewSession.findById(input.sessionId)
                    .session(mongoSession)
                    .exec();
                if (!session) {
                    throw new error_1.AppError("Session not found", 404);
                }
                if (session.status !== "in_progress") {
                    throw new error_1.AppError("Session already completed or invalid", 400);
                }
                const roleProfile = await RoleProfile_1.RoleProfile.findById(session.roleProfileId)
                    .session(mongoSession)
                    .exec();
                if (!roleProfile) {
                    throw new error_1.AppError("Role profile not found", 404);
                }
                const scoringModel = await ScoringModel_1.ScoringModel.findOne({
                    version: session.scoringModelVersion,
                })
                    .session(mongoSession)
                    .exec();
                if (!scoringModel) {
                    throw new error_1.AppError("Scoring model not found", 404);
                }
                const scoreBySectionId = new Map(input.sectionScores.map((s) => [s.sectionId, s.rawScore]));
                const breakdown = [];
                const sectionScoreDocs = roleProfile.sections.map((section) => {
                    const sectionId = String(section.sectionId);
                    const rawScore = scoreBySectionId.get(sectionId) ?? 0;
                    const percentScore = rawScore * 10;
                    const weightedScore = roundTo2(percentScore * (section.weight / 100));
                    let classification;
                    if (rawScore >= 8) {
                        classification = "strong";
                    }
                    else if (rawScore >= 6) {
                        classification = "moderate";
                    }
                    else {
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
                await SectionScore_1.SectionScore.insertMany(sectionScoreDocs, {
                    session: mongoSession,
                });
                const finalResult = this.scoringService.computeFinalResult(input.sectionScores, {
                    sections: roleProfile.sections.map((s) => ({
                        sectionId: String(s.sectionId),
                        weight: s.weight,
                    })),
                    readinessThreshold: roleProfile.readinessThreshold,
                }, session.level, {
                    difficultyMultipliers: scoringModel.difficultyMultipliers,
                });
                session.overallScore = roundTo2(finalResult.overallScore);
                session.readinessScore = roundTo2(finalResult.readinessScore);
                session.readinessStatus = finalResult.readinessStatus;
                session.readinessGap = roundTo2(finalResult.readinessGap);
                session.status = "completed";
                await session.save({ session: mongoSession });
                await this.progressService.updateProgress(session.candidateId, session.roleProfileId.toString(), session.overallScore);
                const performanceTier = computePerformanceTier(session.overallScore);
                breakdown.sort((a, b) => b.weightedScore - a.weightedScore);
                const strongestSection = breakdown.length > 0 ? breakdown[0] : null;
                const weakestSection = breakdown.length > 0 ? breakdown[breakdown.length - 1] : null;
                const confidenceTarget = roleProfile.readinessThreshold + roleProfile.confidenceBuffer;
                let actionPlan = null;
                if (session.readinessStatus === "not_ready" && weakestSection) {
                    const weightedGap = roundTo2(confidenceTarget - session.overallScore);
                    const weakestWeight = roleProfile.sections.find((s) => String(s.sectionId) === weakestSection.sectionId)?.weight ?? 0;
                    if (weakestWeight > 0) {
                        const requiredPercentIncrease = weightedGap / (weakestWeight / 100);
                        const requiredRawIncrease = requiredPercentIncrease / 10;
                        const recommendedRawScore = Math.ceil(weakestSection.rawScore + requiredRawIncrease);
                        actionPlan = {
                            confidenceTarget,
                            recommendedFocusSection: weakestSection.sectionId,
                            currentRawScore: weakestSection.rawScore,
                            recommendedRawScore,
                        };
                    }
                }
                else {
                    actionPlan = {
                        confidenceTarget,
                        message: "You have crossed readiness. Aim to maintain consistency.",
                    };
                }
                result = {
                    overallScore: session.overallScore,
                    readinessScore: session.readinessScore,
                    readinessStatus: session.readinessStatus ?? "not_ready",
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
        }
        finally {
            mongoSession.endSession();
        }
    }
    async getInterviewHistory(candidateId, page, limit) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            InterviewSession_1.InterviewSession.find({
                candidateId,
                status: 'completed',
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('_id overallScore readinessStatus readinessGap level createdAt')
                .lean()
                .exec(),
            InterviewSession_1.InterviewSession.countDocuments({
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
                level: item.level,
                createdAt: item.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getCandidateSessionsList(candidateId, page, limit) {
        const skip = (page - 1) * limit;
        const filter = { candidateId };
        const [items, total] = await Promise.all([
            InterviewSession_1.InterviewSession.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('_id status scheduledAt overallScore readinessScore readinessStatus readinessGap level createdAt')
                .lean()
                .exec(),
            InterviewSession_1.InterviewSession.countDocuments(filter).exec(),
        ]);
        return {
            items: items.map((item) => ({
                id: String(item._id),
                status: item.status,
                scheduledAt: item.scheduledAt ?? null,
                overallScore: Number(item.overallScore ?? 0),
                readinessScore: Number(item.readinessScore ?? 0),
                readinessStatus: (item.readinessStatus ?? null),
                readinessGap: Number(item.readinessGap ?? 0),
                performanceTier: computePerformanceTier(Number(item.overallScore ?? 0)),
                level: item.level,
                createdAt: item.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getInterviewerSessionsList(interviewerId, page, limit) {
        if (!mongoose_1.Types.ObjectId.isValid(interviewerId)) {
            throw new error_1.AppError('Unauthorized', 401);
        }
        const skip = (page - 1) * limit;
        const filter = { interviewerId: new mongoose_1.Types.ObjectId(interviewerId) };
        const [items, total] = await Promise.all([
            InterviewSession_1.InterviewSession.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('_id status scheduledAt candidateId overallScore readinessScore readinessStatus readinessGap level createdAt')
                .lean()
                .exec(),
            InterviewSession_1.InterviewSession.countDocuments(filter).exec(),
        ]);
        const candidateIds = Array.from(new Set(items
            .map((i) => (typeof i.candidateId === 'string' ? i.candidateId : ''))
            .filter((id) => mongoose_1.Types.ObjectId.isValid(id))));
        const candidates = candidateIds.length
            ? await User_1.User.find({ _id: { $in: candidateIds.map((id) => new mongoose_1.Types.ObjectId(id)) } })
                .select('_id email')
                .lean()
                .exec()
            : [];
        const candidateById = new Map(candidates.map((c) => [String(c._id), { id: String(c._id), email: String(c.email ?? '') }]));
        return {
            items: items.map((item) => {
                const candidateId = String(item.candidateId ?? '');
                const candidate = mongoose_1.Types.ObjectId.isValid(candidateId) ? (candidateById.get(candidateId) ?? null) : null;
                return {
                    id: String(item._id),
                    status: item.status,
                    scheduledAt: item.scheduledAt ?? null,
                    candidateId,
                    candidate,
                    overallScore: Number(item.overallScore ?? 0),
                    readinessScore: Number(item.readinessScore ?? 0),
                    readinessStatus: (item.readinessStatus ?? null),
                    readinessGap: Number(item.readinessGap ?? 0),
                    performanceTier: computePerformanceTier(Number(item.overallScore ?? 0)),
                    level: item.level,
                    createdAt: item.createdAt,
                };
            }),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.InterviewService = InterviewService;
