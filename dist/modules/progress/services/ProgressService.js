"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressService = void 0;
const mongoose_1 = require("mongoose");
const CandidateProgress_1 = require("../models/CandidateProgress");
const error_1 = require("../../../core/error");
function roundTo2(value) {
    return Math.round(value * 100) / 100;
}
class ProgressService {
    async updateProgress(candidateId, roleProfileId, newScore) {
        if (!mongoose_1.Types.ObjectId.isValid(roleProfileId)) {
            throw new error_1.AppError('Invalid roleProfileId', 400);
        }
        const roleProfileObjectId = new mongoose_1.Types.ObjectId(roleProfileId);
        const existing = await CandidateProgress_1.CandidateProgress.findOne({
            candidateId,
            roleProfileId: roleProfileObjectId,
        }).exec();
        const scoreRounded = roundTo2(newScore);
        if (!existing) {
            const created = await CandidateProgress_1.CandidateProgress.create({
                candidateId,
                roleProfileId: roleProfileObjectId,
                totalSessions: 1,
                averageScore: scoreRounded,
                latestScore: scoreRounded,
                previousScore: 0,
                improvementDelta: scoreRounded,
                lastUpdated: new Date(),
            });
            return created;
        }
        const newTotalSessions = existing.totalSessions + 1;
        const previousScore = existing.latestScore;
        const latestScore = scoreRounded;
        existing.totalSessions = newTotalSessions;
        existing.previousScore = previousScore;
        existing.latestScore = latestScore;
        existing.improvementDelta = roundTo2(latestScore - previousScore);
        existing.averageScore = roundTo2((existing.averageScore * (newTotalSessions - 1) + newScore) /
            newTotalSessions);
        existing.lastUpdated = new Date();
        await existing.save();
        return existing;
    }
}
exports.ProgressService = ProgressService;
