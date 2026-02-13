"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionControlService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const InterviewSession_1 = require("../../interview/models/InterviewSession");
const RoleProfile_1 = require("../../scoring/models/RoleProfile");
const ScoringModel_1 = require("../../scoring/models/ScoringModel");
const SectionScore_1 = require("../../interview/models/SectionScore");
const AvailabilitySlot_1 = require("../../availability/models/AvailabilitySlot");
const InterviewerProfile_1 = require("../../interviewer/models/InterviewerProfile");
const PaymentRecord_1 = require("../../payment/models/PaymentRecord");
const ScoringService_1 = require("../../scoring/services/ScoringService");
const error_1 = require("../../../core/error");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../../config/env");
function roundTo2(value) {
    return Math.round(value * 100) / 100;
}
class SessionControlService {
    constructor() {
        this.scoringService = new ScoringService_1.ScoringService();
    }
    async startSession(interviewerId, sessionId) {
        if (!mongoose_1.Types.ObjectId.isValid(interviewerId)) {
            throw new error_1.AppError('Unauthorized', 401);
        }
        if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
            throw new error_1.AppError('Invalid sessionId', 400);
        }
        const session = await InterviewSession_1.InterviewSession.findById(sessionId).exec();
        if (!session) {
            throw new error_1.AppError('Session not found', 404);
        }
        if (!session.interviewerId) {
            throw new error_1.AppError('Session has no interviewer assigned', 400);
        }
        if (session.interviewerId.toString() !== interviewerId) {
            throw new error_1.AppError('Forbidden', 403);
        }
        if (session.status !== 'scheduled') {
            throw new error_1.AppError('Session status invalid', 400);
        }
        if (!session.scheduledAt) {
            throw new error_1.AppError('Session has no scheduledAt', 400);
        }
        const now = Date.now();
        const scheduled = session.scheduledAt.getTime();
        const earliest = scheduled - 5 * 60 * 1000;
        const latest = scheduled + 30 * 60 * 1000;
        if (now < earliest || now > latest) {
            throw new error_1.AppError('Session start time window invalid', 400);
        }
        const updated = await InterviewSession_1.InterviewSession.findOneAndUpdate({ _id: session._id, status: 'scheduled' }, { $set: { status: 'in_progress' } }, { new: true }).exec();
        if (!updated) {
            throw new error_1.AppError('Session status invalid', 400);
        }
        return { status: 'ok' };
    }
    async submitScores(interviewerId, sessionId, sectionScores) {
        if (!mongoose_1.Types.ObjectId.isValid(interviewerId)) {
            throw new error_1.AppError('Unauthorized', 401);
        }
        if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
            throw new error_1.AppError('Invalid sessionId', 400);
        }
        const mongoSession = await mongoose_1.default.startSession();
        try {
            let result;
            await mongoSession.withTransaction(async () => {
                const interviewSession = await InterviewSession_1.InterviewSession.findById(sessionId)
                    .session(mongoSession)
                    .exec();
                if (!interviewSession) {
                    throw new error_1.AppError('Session not found', 404);
                }
                if (!interviewSession.interviewerId) {
                    throw new error_1.AppError('Session has no interviewer assigned', 400);
                }
                if (interviewSession.interviewerId.toString() !== interviewerId) {
                    throw new error_1.AppError('Forbidden', 403);
                }
                if (interviewSession.status !== 'in_progress') {
                    throw new error_1.AppError('Session already completed or invalid', 400);
                }
                const roleProfile = await RoleProfile_1.RoleProfile.findById(interviewSession.roleProfileId)
                    .session(mongoSession)
                    .exec();
                if (!roleProfile) {
                    throw new error_1.AppError('Role profile not found', 404);
                }
                const scoringModel = await ScoringModel_1.ScoringModel.findOne({
                    version: interviewSession.scoringModelVersion,
                })
                    .session(mongoSession)
                    .exec();
                if (!scoringModel) {
                    throw new error_1.AppError('Scoring model not found', 404);
                }
                // Save SectionScore docs for each role section (missing rawScore => 0)
                const scoreBySectionId = new Map(sectionScores.map((s) => [s.sectionId, s.rawScore]));
                const sectionScoreDocs = roleProfile.sections.map((section) => {
                    const sectionId = String(section.sectionId);
                    const rawScore = scoreBySectionId.get(sectionId) ?? 0;
                    const percentScore = rawScore * 10;
                    const weightedScore = roundTo2(percentScore * (section.weight / 100));
                    return {
                        sessionId: interviewSession._id,
                        sectionId: section.sectionId,
                        rawScore,
                        weightedScore,
                    };
                });
                await SectionScore_1.SectionScore.insertMany(sectionScoreDocs, { session: mongoSession, ordered: true });
                const final = this.scoringService.computeFinalResult(sectionScores, {
                    sections: roleProfile.sections.map((s) => ({
                        sectionId: String(s.sectionId),
                        weight: s.weight,
                    })),
                    readinessThreshold: roleProfile.readinessThreshold,
                }, interviewSession.level, { difficultyMultipliers: scoringModel.difficultyMultipliers });
                // Prevent double completion with conditional update
                const updatedSession = await InterviewSession_1.InterviewSession.findOneAndUpdate({ _id: interviewSession._id, status: 'in_progress' }, {
                    $set: {
                        overallScore: roundTo2(final.overallScore),
                        readinessScore: roundTo2(final.readinessScore),
                        readinessStatus: final.readinessStatus,
                        readinessGap: roundTo2(final.readinessGap),
                        status: 'completed',
                    },
                }, { new: true, session: mongoSession }).exec();
                if (!updatedSession) {
                    throw new error_1.AppError('Session already completed or invalid', 400);
                }
                if (!updatedSession.slotId) {
                    throw new error_1.AppError('Session has no slotId', 400);
                }
                // Slot -> completed
                await AvailabilitySlot_1.AvailabilitySlot.findOneAndUpdate({ _id: updatedSession.slotId, status: { $ne: 'cancelled' } }, { $set: { status: 'completed' } }, { session: mongoSession }).exec();
                // Earnings + total interviews (from PaymentRecord)
                const payment = await PaymentRecord_1.PaymentRecord.findOne({ sessionId: updatedSession._id })
                    .session(mongoSession)
                    .exec();
                if (!payment) {
                    throw new error_1.AppError('Payment record not found', 404);
                }
                if (payment.status !== 'paid') {
                    throw new error_1.AppError('Payment not completed', 400);
                }
                const profile = await InterviewerProfile_1.InterviewerProfile.findOne({
                    userId: new mongoose_1.Types.ObjectId(interviewerId),
                })
                    .session(mongoSession)
                    .exec();
                if (!profile) {
                    throw new error_1.AppError('Interviewer profile not found', 404);
                }
                await InterviewerProfile_1.InterviewerProfile.updateOne({ _id: profile._id }, {
                    $inc: {
                        totalInterviews: 1,
                        earningsTotal: payment.interviewerShare,
                    },
                }, { session: mongoSession }).exec();
                result = {
                    overallScore: updatedSession.overallScore,
                    readinessScore: updatedSession.readinessScore,
                    readinessStatus: updatedSession.readinessStatus ?? 'not_ready',
                    readinessGap: updatedSession.readinessGap,
                };
            });
            return result;
        }
        finally {
            await mongoSession.endSession();
        }
    }
    async rescheduleSession(candidateId, sessionId, newSlotId) {
        if (!mongoose_1.Types.ObjectId.isValid(candidateId)) {
            throw new error_1.AppError('Unauthorized', 401);
        }
        if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
            throw new error_1.AppError('Invalid sessionId', 400);
        }
        if (!mongoose_1.Types.ObjectId.isValid(newSlotId)) {
            throw new error_1.AppError('Invalid slotId', 400);
        }
        const mongoSession = await mongoose_1.default.startSession();
        try {
            let summary = null;
            await mongoSession.withTransaction(async () => {
                const session = await InterviewSession_1.InterviewSession.findById(sessionId)
                    .session(mongoSession)
                    .exec();
                if (!session) {
                    throw new error_1.AppError('Session not found', 404);
                }
                if (session.candidateId !== candidateId) {
                    throw new error_1.AppError('Forbidden', 403);
                }
                if (session.status !== 'scheduled') {
                    throw new error_1.AppError('Session status invalid', 400);
                }
                const currentCount = session.rescheduleCount ?? 0;
                if (currentCount >= 1) {
                    throw new error_1.AppError('Reschedule limit reached', 400);
                }
                if (!session.scheduledAt) {
                    throw new error_1.AppError('Session has no scheduledAt', 400);
                }
                const now = Date.now();
                const cutoff = session.scheduledAt.getTime() - 2 * 60 * 60 * 1000;
                if (now > cutoff) {
                    throw new error_1.AppError('Reschedule window expired', 400);
                }
                if (!session.slotId) {
                    throw new error_1.AppError('Session has no slotId', 400);
                }
                const [oldSlot, newSlot] = await Promise.all([
                    AvailabilitySlot_1.AvailabilitySlot.findById(session.slotId).session(mongoSession).exec(),
                    AvailabilitySlot_1.AvailabilitySlot.findById(newSlotId).session(mongoSession).exec(),
                ]);
                if (!oldSlot) {
                    throw new error_1.AppError('Old slot not found', 404);
                }
                if (!newSlot) {
                    throw new error_1.AppError('New slot not found', 404);
                }
                if (newSlot.status !== 'available') {
                    throw new error_1.AppError('Slot is not available', 400);
                }
                // Keep the session consistent: same interviewer + role profile.
                if (session.interviewerId &&
                    newSlot.interviewerId.toString() !== session.interviewerId.toString()) {
                    throw new error_1.AppError('New slot interviewer mismatch', 400);
                }
                if (newSlot.roleProfileId.toString() !== session.roleProfileId.toString()) {
                    throw new error_1.AppError('New slot role profile mismatch', 400);
                }
                // Release old slot and reserve new slot.
                await AvailabilitySlot_1.AvailabilitySlot.updateOne({ _id: oldSlot._id, status: 'reserved' }, { $set: { status: 'available' } }, { session: mongoSession }).exec();
                const reservedNew = await AvailabilitySlot_1.AvailabilitySlot.findOneAndUpdate({ _id: newSlot._id, status: 'available' }, { $set: { status: 'reserved' } }, { new: true, session: mongoSession }).exec();
                if (!reservedNew) {
                    throw new error_1.AppError('Slot is not available', 400);
                }
                const updated = await InterviewSession_1.InterviewSession.findOneAndUpdate({ _id: session._id, status: 'scheduled', rescheduleCount: { $lt: 1 } }, {
                    $set: {
                        slotId: reservedNew._id,
                        scheduledAt: reservedNew.startTime,
                    },
                    $inc: { rescheduleCount: 1 },
                }, { new: true, session: mongoSession }).exec();
                if (!updated) {
                    throw new error_1.AppError('Reschedule failed', 400);
                }
                summary = {
                    id: updated._id.toString(),
                    slotId: updated.slotId?.toString() ?? reservedNew._id.toString(),
                    scheduledAt: updated.scheduledAt ?? reservedNew.startTime,
                    status: 'scheduled',
                    rescheduleCount: updated.rescheduleCount,
                };
            });
            if (!summary) {
                throw new error_1.AppError('Reschedule failed', 500);
            }
            return summary;
        }
        finally {
            await mongoSession.endSession();
        }
    }
    async createJoinToken(userId, role, sessionId) {
        if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
            throw new error_1.AppError('Invalid sessionId', 400);
        }
        const session = await InterviewSession_1.InterviewSession.findById(sessionId).lean().exec();
        if (!session) {
            throw new error_1.AppError('Session not found', 404);
        }
        if (session.status !== 'scheduled' && session.status !== 'in_progress') {
            throw new error_1.AppError('Session status invalid', 400);
        }
        if (!session.mediaMeetingCreated) {
            throw new error_1.AppError('Media meeting not ready', 400);
        }
        const isCandidate = session.candidateId === userId;
        const isInterviewer = !!session.interviewerId && String(session.interviewerId) === userId;
        if (!isCandidate && !isInterviewer) {
            throw new error_1.AppError('Forbidden', 403);
        }
        const scheduledAt = session.scheduledAt ? new Date(session.scheduledAt) : null;
        if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
            throw new error_1.AppError('Session has no scheduledAt', 400);
        }
        const now = Date.now();
        const scheduled = scheduledAt.getTime();
        const earliest = scheduled - 5 * 60 * 1000;
        const latest = session.status === 'in_progress'
            ? scheduled + 60 * 60 * 1000
            : scheduled + 30 * 60 * 1000;
        if (now < earliest || now > latest) {
            throw new error_1.AppError('Join time window invalid', 400);
        }
        const token = jsonwebtoken_1.default.sign({
            meetingId: String(session._id),
            userId,
            role,
        }, env_1.config.chamcallSharedSecret, { expiresIn: '5m' });
        return {
            token,
            signalingUrl: env_1.config.mediaBaseUrl,
        };
    }
}
exports.SessionControlService = SessionControlService;
