"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringService = void 0;
function roundTo2(value) {
    return Math.round(value * 100) / 100;
}
class ScoringService {
    calculateWeightedScore(sectionScores, roleProfile) {
        const scoreBySectionId = new Map(sectionScores.map((s) => [s.sectionId, s.rawScore]));
        const total = roleProfile.sections.reduce((sum, section) => {
            const rawScore = scoreBySectionId.get(section.sectionId) ?? 0;
            const percentScore = rawScore * 10;
            const weighted = percentScore * (section.weight / 100);
            return sum + weighted;
        }, 0);
        return roundTo2(total);
    }
    applyDifficultyMultiplier(score, level, scoringModel) {
        const multiplier = scoringModel.difficultyMultipliers[level];
        const adjusted = Math.min(score * multiplier, 100);
        return roundTo2(adjusted);
    }
    computeFinalResult(sectionScores, roleProfile, level, scoringModel) {
        const weightedScore = this.calculateWeightedScore(sectionScores, roleProfile);
        const overallScore = this.applyDifficultyMultiplier(weightedScore, level, scoringModel);
        const readinessScore = overallScore;
        const readinessStatus = overallScore >= roleProfile.readinessThreshold ? 'ready' : 'not_ready';
        const readinessGap = readinessStatus === 'ready'
            ? 0
            : roundTo2(roleProfile.readinessThreshold - overallScore);
        return {
            overallScore,
            readinessScore,
            readinessStatus,
            readinessGap,
        };
    }
}
exports.ScoringService = ScoringService;
