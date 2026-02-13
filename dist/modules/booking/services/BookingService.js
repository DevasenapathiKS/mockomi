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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AvailabilitySlot_1 = require("../../availability/models/AvailabilitySlot");
const InterviewSession_1 = require("../../interview/models/InterviewSession");
const ScoringModel_1 = require("../../scoring/models/ScoringModel");
const error_1 = require("../../../core/error");
const PaymentService_1 = require("../../payment/services/PaymentService");
const MediaService_1 = require("../../media/services/MediaService");
class BookingService {
    constructor() {
        this.paymentService = new PaymentService_1.PaymentService();
        this.mediaService = new MediaService_1.MediaService();
    }
    async bookSlot(candidateId, slotId) {
        if (!mongoose_1.Types.ObjectId.isValid(candidateId)) {
            throw new error_1.AppError('Unauthorized', 401);
        }
        if (!mongoose_1.Types.ObjectId.isValid(slotId)) {
            throw new error_1.AppError('Invalid slotId', 400);
        }
        const mongoSession = await mongoose_1.default.startSession();
        try {
            const confirmedSummary = await mongoSession.withTransaction(async () => {
                const activeScoringModel = await ScoringModel_1.ScoringModel.findOne({ isActive: true })
                    .sort({ version: -1 })
                    .session(mongoSession)
                    .exec();
                if (!activeScoringModel) {
                    throw new error_1.AppError('Active scoring model not found', 400);
                }
                const slot = await AvailabilitySlot_1.AvailabilitySlot.findById(slotId)
                    .session(mongoSession)
                    .exec();
                if (!slot) {
                    throw new error_1.AppError('Slot not found', 404);
                }
                if (slot.status !== 'available') {
                    throw new error_1.AppError('Slot is not available', 400);
                }
                if (slot.interviewerId.toString() === candidateId) {
                    throw new error_1.AppError('Cannot book your own slot', 400);
                }
                const [createdSession] = await InterviewSession_1.InterviewSession.create([
                    {
                        candidateId,
                        interviewerId: slot.interviewerId,
                        roleProfileId: slot.roleProfileId,
                        slotId: slot._id,
                        scheduledAt: slot.startTime,
                        scoringModelVersion: activeScoringModel.version,
                        level: 'confidence',
                        status: 'scheduled',
                    },
                ], { session: mongoSession });
                const candidateObjectId = new mongoose_1.Types.ObjectId(candidateId);
                const payment = await this.paymentService.createPayment(candidateObjectId, slot.interviewerId, slot._id, createdSession._id, slot.price, mongoSession);
                const confirmed = await this.paymentService.confirmPayment(payment._id.toString(), mongoSession);
                if (confirmed.status !== 'paid') {
                    throw new error_1.AppError('Payment failed', 400);
                }
                const reserved = await AvailabilitySlot_1.AvailabilitySlot.findOneAndUpdate({ _id: slot._id, status: 'available' }, { $set: { status: 'reserved' } }, { new: true, session: mongoSession }).exec();
                if (!reserved) {
                    throw new error_1.AppError('Slot is not available', 400);
                }
                return {
                    id: createdSession._id.toString(),
                    candidateId: createdSession.candidateId,
                    interviewerId: createdSession.interviewerId?.toString() ?? '',
                    roleProfileId: createdSession.roleProfileId.toString(),
                    slotId: createdSession.slotId?.toString() ?? '',
                    scheduledAt: createdSession.scheduledAt ?? slot.startTime,
                    status: 'scheduled',
                };
            });
            // Best-effort media meeting creation (must not fail booking).
            void this.mediaService
                .markMeetingAttempt(confirmedSummary.id, confirmedSummary.scheduledAt)
                .catch(() => undefined);
            return confirmedSummary;
        }
        finally {
            await mongoSession.endSession();
        }
    }
}
exports.BookingService = BookingService;
