import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import { ScoringModel } from "../modules/scoring/models/ScoringModel";
import { SectionDefinition } from "../modules/scoring/models/SectionDefinition";
import { RoleProfile } from "../modules/scoring/models/RoleProfile";
import { InterviewService } from "../modules/interview/services/InterviewService";
import { logger } from "../core/logger";

async function run() {
  await connectDatabase();

  // Clean previous data
  await Promise.all([
    ScoringModel.deleteMany({}),
    SectionDefinition.deleteMany({}),
    RoleProfile.deleteMany({})
  ]);

  // Seed SectionDefinitions
  const technical = await SectionDefinition.create({
    key: "technical",
    label: "Technical",
    isActive: true
  });

  const communication = await SectionDefinition.create({
    key: "communication",
    label: "Communication",
    isActive: true
  });

  // Seed ScoringModel
  await ScoringModel.create({
    version: 1,
    difficultyMultipliers: {
      confidence: 1.0,
      guided: 1.05,
      simulation: 1.1,
      stress: 1.15
    },
    isActive: true
  });

  // Seed RoleProfile
  const roleProfile = await RoleProfile.create({
    name: "Backend Junior",
    experienceLevel: "junior",
    sections: [
      { sectionId: technical._id, weight: 60 },
      { sectionId: communication._id, weight: 40 }
    ],
    readinessThreshold: 70,
    isActive: true
  });

  const interviewService = new InterviewService();

  // Start Interview
  const session = await interviewService.startInterview({
    candidateId: "candidate-1",
    roleProfileId: roleProfile._id.toString(),
    level: "confidence"
  });

  logger.info({ sessionId: session._id.toString() }, "Session started");

  // Complete Interview
  const result = await interviewService.completeInterview({
    sessionId: session._id.toString(),
    sectionScores: [
      { sectionId: technical._id.toString(), rawScore: 8 },
      { sectionId: communication._id.toString(), rawScore: 15 }
    ]
  });

  logger.info({ result }, "Final Result");

  await mongoose.disconnect();
}

run();
