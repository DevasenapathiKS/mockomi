import { InterviewerProfile } from '../models/InterviewerProfile';
import type { SortOrder } from 'mongoose';

export type PublicInterviewerSort = 'rating' | 'experience' | 'interviews';

export type GetPublicInterviewersQuery = {
  page?: number;
  limit?: number;
  sort?: string;
  tech?: string;
};

export class InterviewerService {
  public async getPublicInterviewers(query: GetPublicInterviewersQuery): Promise<{
    items: Array<{
      id: string; // interviewer userId (used for /api/interviewers/:id/slots)
      bio: string;
      yearsOfExperience: number;
      primaryTechStack: string[];
      ratingAverage: number;
      totalRatings: number;
      totalInterviews: number;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = query.page && query.page >= 1 ? Math.floor(query.page) : 1;
    const rawLimit = query.limit && query.limit >= 1 ? Math.floor(query.limit) : 10;
    const limit = Math.min(rawLimit, 50);

    const tech = query.tech?.trim();

    const filter: Record<string, unknown> = {
      isVerified: true,
      isActive: true,
    };

    if (tech) {
      filter.primaryTechStack = { $regex: new RegExp(tech, 'i') };
    }

    const sortKey = (query.sort ?? 'rating') as PublicInterviewerSort;
    const sort: Record<string, SortOrder> =
      sortKey === 'experience'
        ? { yearsOfExperience: 'desc' }
        : sortKey === 'interviews'
          ? { totalInterviews: 'desc' }
          : { ratingAverage: 'desc' };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      InterviewerProfile.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select(
          'userId bio yearsOfExperience primaryTechStack ratingAverage totalRatings totalInterviews',
        )
        .lean()
        .exec(),
      InterviewerProfile.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((i: any) => ({
        id: String(i.userId),
        bio: String(i.bio ?? ''),
        yearsOfExperience: Number(i.yearsOfExperience ?? 0),
        primaryTechStack: Array.isArray(i.primaryTechStack) ? i.primaryTechStack : [],
        ratingAverage: Number(i.ratingAverage ?? 0),
        totalRatings: Number(i.totalRatings ?? 0),
        totalInterviews: Number(i.totalInterviews ?? 0),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

