import { config } from '../../../config/env';
import { InterviewSession } from '../../interview/models/InterviewSession';

type CreateMeetingInput = {
  meetingId: string;
  scheduledAt: Date;
  durationMinutes: 30;
};

class MediaServiceError extends Error {
  public readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'MediaServiceError';
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MediaService {
  public async createMeeting(sessionId: string, scheduledAt: Date): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const url = `${config.mediaBaseUrl.replace(/\/$/, '')}/internal/meetings`;
      const body: CreateMeetingInput = {
        meetingId: sessionId,
        scheduledAt,
        durationMinutes: 30,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': config.mediaInternalSecret,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new MediaServiceError('Media meeting creation failed', response.status);
      }
    } catch (error: unknown) {
      if (error instanceof MediaServiceError) throw error;
      throw new MediaServiceError('Media meeting creation failed');
    } finally {
      clearTimeout(timeout);
    }
  }

  public async markMeetingAttempt(
    sessionId: string,
    scheduledAt: Date,
  ): Promise<void> {
    try {
      await this.createMeeting(sessionId, scheduledAt);

      await InterviewSession.updateOne(
        { _id: sessionId },
        { $set: { mediaMeetingCreated: true } },
      ).exec();
    } catch (error: unknown) {
      const status = error instanceof MediaServiceError ? error.status : undefined;

      // If the media service says it already exists, treat as success (idempotent).
      if (status === 409) {
        await InterviewSession.updateOne(
          { _id: sessionId },
          { $set: { mediaMeetingCreated: true } },
        ).exec();
        return;
      }

      await InterviewSession.updateOne(
        { _id: sessionId },
        {
          $set: { mediaMeetingCreated: false },
          $inc: { mediaCreationAttempts: 1 },
        },
      ).exec();
    }
  }

  public async retryPendingMeetings(): Promise<void> {
    const pending = await InterviewSession.find({
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
      const scheduledAt = session.scheduledAt as Date | undefined;
      if (!scheduledAt) {
        await InterviewSession.updateOne(
          { _id: session._id },
          { $inc: { mediaCreationAttempts: 1 } },
        ).exec();
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

