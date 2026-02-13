"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const env_1 = require("../../../config/env");
const InterviewSession_1 = require("../../interview/models/InterviewSession");
class MediaServiceError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'MediaServiceError';
        this.status = status;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
class MediaService {
    async createMeeting(sessionId, scheduledAt) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
            const url = `${env_1.config.mediaBaseUrl.replace(/\/$/, '')}/internal/meetings`;
            const body = {
                meetingId: sessionId,
                scheduledAt,
                durationMinutes: 30,
            };
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Secret': env_1.config.mediaInternalSecret,
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new MediaServiceError('Media meeting creation failed', response.status);
            }
        }
        catch (error) {
            if (error instanceof MediaServiceError)
                throw error;
            throw new MediaServiceError('Media meeting creation failed');
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async markMeetingAttempt(sessionId, scheduledAt) {
        try {
            await this.createMeeting(sessionId, scheduledAt);
            await InterviewSession_1.InterviewSession.updateOne({ _id: sessionId }, { $set: { mediaMeetingCreated: true } }).exec();
        }
        catch (error) {
            const status = error instanceof MediaServiceError ? error.status : undefined;
            // If the media service says it already exists, treat as success (idempotent).
            if (status === 409) {
                await InterviewSession_1.InterviewSession.updateOne({ _id: sessionId }, { $set: { mediaMeetingCreated: true } }).exec();
                return;
            }
            await InterviewSession_1.InterviewSession.updateOne({ _id: sessionId }, {
                $set: { mediaMeetingCreated: false },
                $inc: { mediaCreationAttempts: 1 },
            }).exec();
        }
    }
    async retryPendingMeetings() {
        const pending = await InterviewSession_1.InterviewSession.find({
            mediaMeetingCreated: false,
            mediaCreationAttempts: { $lt: 5 },
            status: { $ne: 'cancelled' },
        })
            .sort({ createdAt: -1 })
            .limit(25)
            .select('_id scheduledAt mediaCreationAttempts')
            .lean()
            .exec();
        for (const session of pending) {
            const scheduledAt = session.scheduledAt;
            if (!scheduledAt) {
                await InterviewSession_1.InterviewSession.updateOne({ _id: session._id }, { $inc: { mediaCreationAttempts: 1 } }).exec();
                continue;
            }
            // Basic exponential backoff based on attempts (capped).
            const attempts = Number(session.mediaCreationAttempts ?? 0);
            const backoffMs = Math.min(2000, 200 * Math.pow(2, attempts));
            if (backoffMs > 0) {
                await sleep(backoffMs);
            }
            await this.markMeetingAttempt(String(session._id), scheduledAt);
        }
    }
}
exports.MediaService = MediaService;
