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
exports.AvailabilityService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AvailabilitySlot_1 = require("../models/AvailabilitySlot");
const InterviewerProfile_1 = require("../../interviewer/models/InterviewerProfile");
const RoleProfile_1 = require("../../scoring/models/RoleProfile");
const error_1 = require("../../../core/error");
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
class AvailabilityService {
    async getAvailableSlots(interviewerId, page = 1, limit = 10) {
        if (!mongoose_1.Types.ObjectId.isValid(interviewerId)) {
            throw new error_1.AppError('Invalid interviewerId', 400);
        }
        const normalizedPage = Number.isInteger(page) && page >= 1 ? page : 1;
        const normalizedLimit = Number.isInteger(limit) && limit >= 1 ? limit : 10;
        const cappedLimit = Math.min(normalizedLimit, 50);
        const profile = await InterviewerProfile_1.InterviewerProfile.findOne({
            userId: new mongoose_1.Types.ObjectId(interviewerId),
            isVerified: true,
            isActive: true,
        })
            .select('_id')
            .lean()
            .exec();
        if (!profile) {
            throw new error_1.AppError('Interviewer not found', 404);
        }
        const skip = (normalizedPage - 1) * cappedLimit;
        const now = new Date();
        const filter = {
            interviewerId: new mongoose_1.Types.ObjectId(interviewerId),
            status: 'available',
            startTime: { $gt: now },
        };
        const [items, total] = await Promise.all([
            AvailabilitySlot_1.AvailabilitySlot.find(filter)
                .sort({ startTime: 1 })
                .skip(skip)
                .limit(cappedLimit)
                .select('_id startTime endTime price')
                .lean()
                .exec(),
            AvailabilitySlot_1.AvailabilitySlot.countDocuments(filter).exec(),
        ]);
        return {
            items: items.map((i) => ({
                id: String(i._id),
                startTime: i.startTime,
                endTime: i.endTime,
                price: i.price,
            })),
            pagination: {
                page: normalizedPage,
                limit: cappedLimit,
                total,
                totalPages: Math.ceil(total / cappedLimit),
            },
        };
    }
    async createSlot(interviewerId, roleProfileId, startTime, price) {
        if (!mongoose_1.Types.ObjectId.isValid(interviewerId)) {
            throw new error_1.AppError('Unauthorized', 401);
        }
        if (Number.isNaN(startTime.getTime())) {
            throw new error_1.AppError('Invalid startTime', 400);
        }
        if (startTime.getTime() <= Date.now()) {
            throw new error_1.AppError('startTime must be in the future', 400);
        }
        const effectiveRoleProfileId = await (async () => {
            if (roleProfileId && mongoose_1.Types.ObjectId.isValid(roleProfileId))
                return roleProfileId;
            const active = await RoleProfile_1.RoleProfile.findOne({ isActive: true })
                .sort({ updatedAt: -1, createdAt: -1 })
                .select('_id')
                .lean()
                .exec();
            if (!active) {
                throw new error_1.AppError('Active role profile not found', 400);
            }
            return String(active._id);
        })();
        const effectivePrice = typeof price === 'number' && Number.isFinite(price) && price >= 0 ? price : 100;
        const endTime = new Date(startTime.getTime() + THIRTY_MINUTES_MS);
        const mongoSession = await mongoose_1.default.startSession();
        try {
            let created;
            await mongoSession.withTransaction(async () => {
                const profile = await InterviewerProfile_1.InterviewerProfile.findOne({
                    userId: new mongoose_1.Types.ObjectId(interviewerId),
                })
                    .session(mongoSession)
                    .exec();
                if (!profile) {
                    throw new error_1.AppError('Interviewer profile not found', 404);
                }
                if (!profile.isVerified) {
                    throw new error_1.AppError('Interviewer is not verified', 403);
                }
                const overlapping = await AvailabilitySlot_1.AvailabilitySlot.findOne({
                    interviewerId: new mongoose_1.Types.ObjectId(interviewerId),
                    status: { $ne: 'cancelled' },
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime },
                })
                    .session(mongoSession)
                    .select('_id')
                    .lean()
                    .exec();
                if (overlapping) {
                    throw new error_1.AppError('Overlapping slot exists', 400);
                }
                const [slot] = await AvailabilitySlot_1.AvailabilitySlot.create([
                    {
                        interviewerId: new mongoose_1.Types.ObjectId(interviewerId),
                        roleProfileId: new mongoose_1.Types.ObjectId(effectiveRoleProfileId),
                        startTime,
                        endTime,
                        status: 'available',
                        price: effectivePrice,
                    },
                ], { session: mongoSession });
                created = slot;
            });
            return created;
        }
        finally {
            await mongoSession.endSession();
        }
    }
    async getInterviewerSlots(interviewerId, limit = 50) {
        if (!mongoose_1.Types.ObjectId.isValid(interviewerId)) {
            throw new error_1.AppError('Unauthorized', 401);
        }
        const cappedLimit = Number.isInteger(limit) && limit >= 1 ? Math.min(limit, 100) : 50;
        const slots = await AvailabilitySlot_1.AvailabilitySlot.find({
            interviewerId: new mongoose_1.Types.ObjectId(interviewerId),
        })
            .sort({ startTime: -1 })
            .limit(cappedLimit)
            .select('_id startTime endTime status price createdAt')
            .lean()
            .exec();
        return slots.map((s) => ({
            id: String(s._id),
            startTime: s.startTime,
            endTime: s.endTime,
            status: String(s.status),
            price: Number(s.price ?? 0),
            createdAt: s.createdAt ?? new Date(0),
        }));
    }
}
exports.AvailabilityService = AvailabilityService;
