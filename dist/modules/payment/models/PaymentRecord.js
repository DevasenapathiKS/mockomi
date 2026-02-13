"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRecord = void 0;
const mongoose_1 = require("mongoose");
const PaymentRecordSchema = new mongoose_1.Schema({
    candidateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    interviewerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    slotId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AvailabilitySlot',
        required: true,
    },
    sessionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'InterviewSession',
        unique: true,
    },
    amountTotal: {
        type: Number,
        required: true,
        min: 0,
    },
    platformShare: {
        type: Number,
        required: true,
        min: 0,
    },
    interviewerShare: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
    },
    paymentProvider: {
        type: String,
        default: 'mock',
    },
    providerOrderId: {
        type: String,
    },
    providerReferenceId: {
        type: String,
    },
}, { timestamps: true });
PaymentRecordSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
PaymentRecordSchema.index({ paymentProvider: 1, providerOrderId: 1 }, { unique: true, sparse: true });
PaymentRecordSchema.index({ candidateId: 1 });
PaymentRecordSchema.index({ interviewerId: 1 });
PaymentRecordSchema.index({ status: 1 });
const MODEL_NAME = 'PaymentRecord';
const existingModel = mongoose_1.models[MODEL_NAME];
exports.PaymentRecord = existingModel ?? (0, mongoose_1.model)(MODEL_NAME, PaymentRecordSchema);
