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
exports.RatingService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const InterviewSession_1 = require("../../interview/models/InterviewSession");
const InterviewerProfile_1 = require("../../interviewer/models/InterviewerProfile");
const SessionRating_1 = require("../models/SessionRating");
const error_1 = require("../../../core/error");
function roundTo2(value) {
    return Math.round(value * 100) / 100;
}
class RatingService {
    async submitRating(candidateId, sessionId, rating, comment) {
        if (!mongoose_1.Types.ObjectId.isValid(candidateId)) {
            throw new error_1.AppError('Unauthorized', 401);
        }
        if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
            throw new error_1.AppError('Invalid sessionId', 400);
        }
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new error_1.AppError('Invalid rating', 400);
        }
        const mongoSession = await mongoose_1.default.startSession();
        try {
            await mongoSession.withTransaction(async () => {
                const session = await InterviewSession_1.InterviewSession.findById(sessionId)
                    .session(mongoSession)
                    .exec();
                if (!session) {
                    throw new error_1.AppError('Session not found', 404);
                }
                if (session.status !== 'completed') {
                    throw new error_1.AppError('Session not completed', 400);
                }
                if (session.candidateId !== candidateId) {
                    throw new error_1.AppError('Forbidden', 403);
                }
                if (!session.interviewerId) {
                    throw new error_1.AppError('Session has no interviewer assigned', 400);
                }
                const existing = await SessionRating_1.SessionRating.findOne({ sessionId: session._id })
                    .session(mongoSession)
                    .select('_id')
                    .lean()
                    .exec();
                if (existing) {
                    throw new error_1.AppError('Rating already submitted', 400);
                }
                await SessionRating_1.SessionRating.create([
                    {
                        sessionId: session._id,
                        candidateId: new mongoose_1.Types.ObjectId(candidateId),
                        interviewerId: session.interviewerId,
                        rating,
                        comment,
                    },
                ], { session: mongoSession });
                const profile = await InterviewerProfile_1.InterviewerProfile.findOne({
                    userId: session.interviewerId,
                })
                    .session(mongoSession)
                    .exec();
                if (!profile) {
                    throw new error_1.AppError('Interviewer profile not found', 404);
                }
                const totalRatings = profile.totalRatings ?? 0;
                const oldAvg = profile.ratingAverage ?? 0;
                const newAvg = roundTo2((oldAvg * totalRatings + rating) / (totalRatings + 1));
                await InterviewerProfile_1.InterviewerProfile.updateOne({ _id: profile._id }, {
                    $set: { ratingAverage: newAvg },
                    $inc: { totalRatings: 1 },
                }, { session: mongoSession }).exec();
            });
            return { status: 'ok' };
        }
        finally {
            await mongoSession.endSession();
        }
    }
}
exports.RatingService = RatingService;
