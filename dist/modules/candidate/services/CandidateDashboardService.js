"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidateDashboardService = void 0;
const mongoose_1 = require("mongoose");
const error_1 = require("../../../core/error");
const CandidateProgress_1 = require("../../progress/models/CandidateProgress");
const InterviewSession_1 = require("../../interview/models/InterviewSession");
const SectionScore_1 = require("../../interview/models/SectionScore");
const SectionDefinition_1 = require("../../scoring/models/SectionDefinition");
function motivationFromReadiness(readinessScore) {
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
class CandidateDashboardService {
    async getDashboard(candidateId) {
        if (!candidateId || candidateId.trim().length === 0) {
            throw new error_1.AppError('Invalid candidateId', 400);
        }
        const last5CompletedSessions = await InterviewSession_1.InterviewSession.find({
            candidateId,
            status: 'completed',
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('_id roleProfileId interviewerId scheduledAt overallScore status createdAt')
            .lean()
            .exec();
        const trend = last5CompletedSessions.map((s) => ({
            date: s.createdAt.toISOString(),
            score: Number(s.overallScore ?? 0),
        }));
        const progress = await CandidateProgress_1.CandidateProgress.findOne({ candidateId })
            .sort({ lastUpdated: -1, updatedAt: -1, createdAt: -1 })
            .lean()
            .exec();
        const performance = {
            readinessScore: Number(progress?.latestScore ?? 0),
            improvementDelta: Number(progress?.improvementDelta ?? 0),
            totalSessions: Number(progress?.totalSessions ?? 0),
            averageScore: Number(progress?.averageScore ?? 0),
            latestScore: Number(progress?.latestScore ?? 0),
        };
        const motivation = motivationFromReadiness(performance.readinessScore);
        const recent = await InterviewSession_1.InterviewSession.find({ candidateId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('_id scheduledAt interviewerId overallScore status')
            .lean()
            .exec();
        const recentSessions = recent.map((s) => ({
            id: String(s._id),
            scheduledAt: s.scheduledAt ? s.scheduledAt.toISOString() : null,
            interviewerId: s.interviewerId ? String(s.interviewerId) : null,
            overallScore: Number(s.overallScore ?? 0),
            status: String(s.status),
        }));
        const latestCompleted = last5CompletedSessions[0] ?? null;
        const weakestSection = await (async () => {
            if (!latestCompleted)
                return null;
            const sessionId = String(latestCompleted._id);
            if (!mongoose_1.Types.ObjectId.isValid(sessionId))
                return null;
            const weakest = await SectionScore_1.SectionScore.findOne({
                sessionId: new mongoose_1.Types.ObjectId(sessionId),
            })
                .sort({ weightedScore: 1 })
                .lean()
                .exec();
            if (!weakest)
                return null;
            const sectionId = String(weakest.sectionId);
            const section = mongoose_1.Types.ObjectId.isValid(sectionId)
                ? await SectionDefinition_1.SectionDefinition.findById(sectionId).select('label').lean().exec()
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
exports.CandidateDashboardService = CandidateDashboardService;
