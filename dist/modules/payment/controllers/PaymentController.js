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
exports.PaymentController = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AvailabilitySlot_1 = require("../../availability/models/AvailabilitySlot");
const InterviewSession_1 = require("../../interview/models/InterviewSession");
const ScoringModel_1 = require("../../scoring/models/ScoringModel");
const PaymentRecord_1 = require("../models/PaymentRecord");
const RazorpayService_1 = require("../services/RazorpayService");
const MediaService_1 = require("../../media/services/MediaService");
const error_1 = require("../../../core/error");
const response_1 = require("../../../core/response");
const env_1 = require("../../../config/env");
class PaymentController {
    constructor() {
        this.createOrder = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                if (req.user.role !== 'candidate') {
                    throw new error_1.AppError('Forbidden', 403);
                }
                const { slotId } = req.body;
                if (!mongoose_1.Types.ObjectId.isValid(slotId)) {
                    throw new error_1.AppError('Invalid slotId', 400);
                }
                const slot = await AvailabilitySlot_1.AvailabilitySlot.findById(slotId).lean().exec();
                if (!slot) {
                    throw new error_1.AppError('Slot not found', 404);
                }
                if (slot.status !== 'available') {
                    throw new error_1.AppError('Slot is not available', 400);
                }
                if (slot.startTime.getTime() <= Date.now()) {
                    throw new error_1.AppError('Slot is not available', 400);
                }
                if (String(slot.interviewerId) === req.user.userId) {
                    throw new error_1.AppError('Cannot book your own slot', 400);
                }
                const amount = Number(slot.price);
                if (!Number.isFinite(amount) || amount <= 0) {
                    throw new error_1.AppError('Invalid slot price', 500);
                }
                const platformShare = amount * 0.1;
                const interviewerShare = amount * 0.9;
                const paymentRecord = await PaymentRecord_1.PaymentRecord.create({
                    candidateId: new mongoose_1.Types.ObjectId(req.user.userId),
                    interviewerId: slot.interviewerId,
                    slotId: slot._id,
                    amountTotal: amount,
                    platformShare,
                    interviewerShare,
                    status: 'pending',
                    paymentProvider: 'razorpay',
                });
                const order = await this.razorpayService.createOrder(amount);
                paymentRecord.providerOrderId = order.id;
                await paymentRecord.save();
                (0, response_1.sendSuccess)(res, {
                    keyId: env_1.config.razorpayKeyId,
                    order,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.verify = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                if (req.user.role !== 'candidate') {
                    throw new error_1.AppError('Forbidden', 403);
                }
                const { razorpay_order_id, razorpay_payment_id, razorpay_signature, slotId, } = req.body;
                if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                    throw new error_1.AppError('Invalid payment payload', 400);
                }
                if (!mongoose_1.Types.ObjectId.isValid(slotId)) {
                    throw new error_1.AppError('Invalid slotId', 400);
                }
                const isValid = this.razorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
                if (!isValid) {
                    throw new error_1.AppError('Invalid signature', 400);
                }
                const mongoSession = await mongoose_1.default.startSession();
                try {
                    let summary;
                    let createdSessionId = null;
                    let scheduledAt = null;
                    await mongoSession.withTransaction(async () => {
                        const paymentRecord = await PaymentRecord_1.PaymentRecord.findOne({
                            paymentProvider: 'razorpay',
                            providerOrderId: razorpay_order_id,
                        })
                            .session(mongoSession)
                            .exec();
                        if (!paymentRecord) {
                            throw new error_1.AppError('Payment record not found', 404);
                        }
                        if (paymentRecord.status !== 'pending') {
                            throw new error_1.AppError('Payment already processed', 400);
                        }
                        if (paymentRecord.candidateId.toString() !== req.user.userId) {
                            throw new error_1.AppError('Forbidden', 403);
                        }
                        if (paymentRecord.slotId.toString() !== slotId) {
                            throw new error_1.AppError('Invalid slot', 400);
                        }
                        const slot = await AvailabilitySlot_1.AvailabilitySlot.findOneAndUpdate({ _id: new mongoose_1.Types.ObjectId(slotId), status: 'available' }, { $set: { status: 'reserved' } }, { new: true, session: mongoSession }).exec();
                        if (!slot) {
                            throw new error_1.AppError('Slot is not available', 400);
                        }
                        if (slot.interviewerId.toString() === req.user.userId) {
                            throw new error_1.AppError('Cannot book your own slot', 400);
                        }
                        const activeScoringModel = await ScoringModel_1.ScoringModel.findOne({ isActive: true })
                            .sort({ version: -1 })
                            .session(mongoSession)
                            .exec();
                        if (!activeScoringModel) {
                            throw new error_1.AppError('Active scoring model not found', 400);
                        }
                        const [createdSession] = await InterviewSession_1.InterviewSession.create([
                            {
                                candidateId: req.user.userId,
                                interviewerId: slot.interviewerId,
                                roleProfileId: slot.roleProfileId,
                                slotId: slot._id,
                                scheduledAt: slot.startTime,
                                scoringModelVersion: activeScoringModel.version,
                                level: 'confidence',
                                status: 'scheduled',
                            },
                        ], { session: mongoSession });
                        const updatedPayment = await PaymentRecord_1.PaymentRecord.findOneAndUpdate({ _id: paymentRecord._id, status: 'pending' }, {
                            $set: {
                                status: 'paid',
                                providerReferenceId: razorpay_payment_id,
                                sessionId: createdSession._id,
                            },
                        }, { new: true, session: mongoSession }).exec();
                        if (!updatedPayment) {
                            throw new error_1.AppError('Payment already processed', 400);
                        }
                        createdSessionId = createdSession._id.toString();
                        scheduledAt = (createdSession.scheduledAt ?? slot.startTime);
                        summary = {
                            id: createdSession._id.toString(),
                            candidateId: createdSession.candidateId,
                            interviewerId: createdSession.interviewerId?.toString() ?? '',
                            roleProfileId: createdSession.roleProfileId.toString(),
                            slotId: createdSession.slotId?.toString() ?? '',
                            scheduledAt: createdSession.scheduledAt ?? slot.startTime,
                            status: 'scheduled',
                        };
                    });
                    if (createdSessionId && scheduledAt) {
                        void this.mediaService
                            .markMeetingAttempt(createdSessionId, scheduledAt)
                            .catch(() => undefined);
                    }
                    (0, response_1.sendSuccess)(res, summary);
                }
                finally {
                    await mongoSession.endSession();
                }
            }
            catch (error) {
                next(error);
            }
        };
        this.webhook = async (req, res, next) => {
            try {
                if (!Buffer.isBuffer(req.body)) {
                    throw new error_1.AppError('Invalid webhook body', 400);
                }
                const signatureHeader = req.headers['x-razorpay-signature'];
                const signature = typeof signatureHeader === 'string'
                    ? signatureHeader
                    : Array.isArray(signatureHeader) && typeof signatureHeader[0] === 'string'
                        ? signatureHeader[0]
                        : undefined;
                if (!signature) {
                    throw new error_1.AppError('Missing signature', 400);
                }
                const rawBody = req.body;
                const isValid = this.razorpayService.verifyWebhookSignature(rawBody, signature);
                if (!isValid) {
                    throw new error_1.AppError('Invalid signature', 400);
                }
                let payload;
                try {
                    payload = JSON.parse(rawBody.toString('utf8'));
                }
                catch {
                    throw new error_1.AppError('Invalid webhook payload', 400);
                }
                const event = payload.event;
                if (event !== 'payment.captured') {
                    // Acknowledge other events without processing.
                    res.status(200).send('ok');
                    return;
                }
                const orderId = payload?.payload?.payment?.entity?.order_id ??
                    payload?.payload?.order?.entity?.id;
                const paymentId = payload?.payload?.payment?.entity?.id ??
                    payload?.payload?.payment?.entity?.payment_id;
                if (typeof orderId !== 'string' || typeof paymentId !== 'string') {
                    res.status(200).send('ok');
                    return;
                }
                const existing = await PaymentRecord_1.PaymentRecord.findOne({
                    paymentProvider: 'razorpay',
                    providerOrderId: orderId,
                })
                    .select('_id status')
                    .lean()
                    .exec();
                if (!existing) {
                    res.status(200).send('ok');
                    return;
                }
                if (existing.status === 'paid') {
                    res.status(200).send('ok');
                    return;
                }
                const mongoSession = await mongoose_1.default.startSession();
                try {
                    let createdSessionId = null;
                    let scheduledAt = null;
                    await mongoSession.withTransaction(async () => {
                        const paymentRecord = await PaymentRecord_1.PaymentRecord.findOne({
                            paymentProvider: 'razorpay',
                            providerOrderId: orderId,
                        })
                            .session(mongoSession)
                            .exec();
                        if (!paymentRecord) {
                            return;
                        }
                        if (paymentRecord.status === 'paid') {
                            return;
                        }
                        if (paymentRecord.status !== 'pending') {
                            return;
                        }
                        const slot = await AvailabilitySlot_1.AvailabilitySlot.findOneAndUpdate({ _id: paymentRecord.slotId, status: 'available' }, { $set: { status: 'reserved' } }, { new: true, session: mongoSession }).exec();
                        if (!slot) {
                            throw new error_1.AppError('Slot is not available', 400);
                        }
                        const activeScoringModel = await ScoringModel_1.ScoringModel.findOne({ isActive: true })
                            .sort({ version: -1 })
                            .session(mongoSession)
                            .exec();
                        if (!activeScoringModel) {
                            throw new error_1.AppError('Active scoring model not found', 400);
                        }
                        const [createdSession] = await InterviewSession_1.InterviewSession.create([
                            {
                                candidateId: paymentRecord.candidateId.toString(),
                                interviewerId: paymentRecord.interviewerId,
                                roleProfileId: slot.roleProfileId,
                                slotId: slot._id,
                                scheduledAt: slot.startTime,
                                scoringModelVersion: activeScoringModel.version,
                                level: 'confidence',
                                status: 'scheduled',
                            },
                        ], { session: mongoSession });
                        const updated = await PaymentRecord_1.PaymentRecord.findOneAndUpdate({ _id: paymentRecord._id, status: 'pending' }, {
                            $set: {
                                status: 'paid',
                                providerReferenceId: paymentId,
                                sessionId: createdSession._id,
                            },
                        }, { new: true, session: mongoSession }).exec();
                        if (!updated) {
                            throw new error_1.AppError('Payment already processed', 400);
                        }
                        createdSessionId = createdSession._id.toString();
                        scheduledAt = (createdSession.scheduledAt ?? slot.startTime);
                    });
                    if (createdSessionId && scheduledAt) {
                        void this.mediaService
                            .markMeetingAttempt(createdSessionId, scheduledAt)
                            .catch(() => undefined);
                    }
                    res.status(200).send('ok');
                }
                finally {
                    await mongoSession.endSession();
                }
            }
            catch (error) {
                next(error);
            }
        };
        this.razorpayService = new RazorpayService_1.RazorpayService();
        this.mediaService = new MediaService_1.MediaService();
    }
}
exports.PaymentController = PaymentController;
