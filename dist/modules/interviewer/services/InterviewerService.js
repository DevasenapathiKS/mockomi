"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewerService = void 0;
const InterviewerProfile_1 = require("../models/InterviewerProfile");
class InterviewerService {
    async getPublicInterviewers(query) {
        const page = query.page && query.page >= 1 ? Math.floor(query.page) : 1;
        const rawLimit = query.limit && query.limit >= 1 ? Math.floor(query.limit) : 10;
        const limit = Math.min(rawLimit, 50);
        const tech = query.tech?.trim();
        const filter = {
            isVerified: true,
            isActive: true,
        };
        if (tech) {
            filter.primaryTechStack = { $regex: new RegExp(tech, 'i') };
        }
        const sortKey = (query.sort ?? 'rating');
        const sort = sortKey === 'experience'
            ? { yearsOfExperience: 'desc' }
            : sortKey === 'interviews'
                ? { totalInterviews: 'desc' }
                : { ratingAverage: 'desc' };
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            InterviewerProfile_1.InterviewerProfile.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select('userId bio yearsOfExperience primaryTechStack ratingAverage totalRatings totalInterviews')
                .lean()
                .exec(),
            InterviewerProfile_1.InterviewerProfile.countDocuments(filter).exec(),
        ]);
        return {
            items: items.map((i) => ({
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
exports.InterviewerService = InterviewerService;
