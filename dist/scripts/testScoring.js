"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ScoringService_1 = require("../modules/scoring/services/ScoringService");
const logger_1 = require("../core/logger");
const scoringService = new ScoringService_1.ScoringService();
// Mock RoleProfile
const roleProfile = {
    sections: [
        { sectionId: "technical", weight: 60 },
        { sectionId: "communication", weight: 40 }
    ],
    readinessThreshold: 70
};
// Mock Section Scores
const sectionScores = [
    { sectionId: "technical", rawScore: 8 },
    { sectionId: "communication", rawScore: 5 }
];
// Mock ScoringModel
const scoringModel = {
    difficultyMultipliers: {
        confidence: 1.0,
        guided: 1.05,
        simulation: 1.1,
        stress: 1.15
    }
};
logger_1.logger.info({
    mode: "confidence",
    result: scoringService.computeFinalResult(sectionScores, roleProfile, "confidence", scoringModel),
}, "Scoring result");
logger_1.logger.info({
    mode: "simulation",
    result: scoringService.computeFinalResult(sectionScores, roleProfile, "simulation", scoringModel),
}, "Scoring result");
