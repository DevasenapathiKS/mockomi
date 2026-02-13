"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilitySlot = void 0;
const mongoose_1 = require("mongoose");
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const AvailabilitySlotSchema = new mongoose_1.Schema({
    interviewerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    roleProfileId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'RoleProfile',
        required: true,
    },
    startTime: {
        type: Date,
        required: true,
        validate: {
            validator: (value) => value.getTime() > Date.now(),
            message: 'startTime must be in the future',
        },
    },
    endTime: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                const startTime = this.startTime;
                if (!startTime)
                    return false;
                return value.getTime() - startTime.getTime() === THIRTY_MINUTES_MS;
            },
            message: 'endTime must be exactly 30 minutes after startTime',
        },
    },
    status: {
        type: String,
        enum: ['available', 'reserved', 'completed', 'cancelled'],
        default: 'available',
    },
    price: {
        type: Number,
        required: true,
        default: 100,
        min: 0,
    },
}, { timestamps: true });
AvailabilitySlotSchema.index({ interviewerId: 1 });
AvailabilitySlotSchema.index({ roleProfileId: 1 });
AvailabilitySlotSchema.index({ startTime: 1 });
AvailabilitySlotSchema.index({ status: 1 });
AvailabilitySlotSchema.index({ interviewerId: 1, startTime: 1 });
const MODEL_NAME = 'AvailabilitySlot';
const existingModel = mongoose_1.models[MODEL_NAME];
exports.AvailabilitySlot = existingModel ?? (0, mongoose_1.model)(MODEL_NAME, AvailabilitySlotSchema);
