export type DifficultyLevel = 'confidence' | 'guided' | 'simulation' | 'stress';

export interface SectionScoreInput {
  sectionId: string;
  rawScore: number; // expected 0–10
}

export interface RoleProfileInput {
  sections: Array<{ sectionId: string; weight: number }>;
  readinessThreshold: number;
}

export interface ScoringModelInput {
  difficultyMultipliers: {
    confidence: number;
    guided: number;
    simulation: number;
    stress: number;
  };
}

export type ReadinessStatus = 'ready' | 'not_ready';

export interface FinalResult {
  overallScore: number;
  readinessScore: number;
  readinessStatus: ReadinessStatus;
  readinessGap: number;
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

export class ScoringService {
  public calculateWeightedScore(
    sectionScores: SectionScoreInput[],
    roleProfile: RoleProfileInput,
  ): number {
    const scoreBySectionId = new Map<string, number>(
      sectionScores.map((s) => [s.sectionId, s.rawScore]),
    );

    const total = roleProfile.sections.reduce((sum, section) => {
      const rawScore = scoreBySectionId.get(section.sectionId) ?? 0;
      const percentScore = rawScore * 10;
      const weighted = percentScore * (section.weight / 100);
      return sum + weighted;
    }, 0);

    return roundTo2(total);
  }

  public applyDifficultyMultiplier(
    score: number,
    level: DifficultyLevel,
    scoringModel: ScoringModelInput,
  ): number {
    const multiplier = scoringModel.difficultyMultipliers[level];
    const adjusted = Math.min(score * multiplier, 100);
    return roundTo2(adjusted);
  }

  public computeFinalResult(
    sectionScores: SectionScoreInput[],
    roleProfile: RoleProfileInput,
    level: DifficultyLevel,
    scoringModel: ScoringModelInput,
  ): FinalResult {
    const weightedScore = this.calculateWeightedScore(sectionScores, roleProfile);
    const overallScore = this.applyDifficultyMultiplier(
      weightedScore,
      level,
      scoringModel,
    );

    const readinessScore = overallScore;
    const readinessStatus: ReadinessStatus =
      overallScore >= roleProfile.readinessThreshold ? 'ready' : 'not_ready';
    const readinessGap =
      readinessStatus === 'ready'
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

