import { ScoringService } from "../modules/scoring/services/ScoringService";
import { logger } from "../core/logger";

const scoringService = new ScoringService();

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

logger.info(
  {
    mode: "confidence",
    result: scoringService.computeFinalResult(
      sectionScores,
      roleProfile,
      "confidence",
      scoringModel
    ),
  },
  "Scoring result"
);

logger.info(
  {
    mode: "simulation",
    result: scoringService.computeFinalResult(
      sectionScores,
      roleProfile,
      "simulation",
      scoringModel
    ),
  },
  "Scoring result"
);
