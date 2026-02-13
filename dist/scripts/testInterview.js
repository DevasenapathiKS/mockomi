"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = require("../config/database");
const ScoringModel_1 = require("../modules/scoring/models/ScoringModel");
const SectionDefinition_1 = require("../modules/scoring/models/SectionDefinition");
const RoleProfile_1 = require("../modules/scoring/models/RoleProfile");
const InterviewService_1 = require("../modules/interview/services/InterviewService");
const logger_1 = require("../core/logger");
async function run() {
    await (0, database_1.connectDatabase)();
    // Clean previous data
    await Promise.all([
        ScoringModel_1.ScoringModel.deleteMany({}),
        SectionDefinition_1.SectionDefinition.deleteMany({}),
        RoleProfile_1.RoleProfile.deleteMany({})
    ]);
    // Seed SectionDefinitions
    const technical = await SectionDefinition_1.SectionDefinition.create({
        key: "technical",
        label: "Technical",
        isActive: true
    });
    const communication = await SectionDefinition_1.SectionDefinition.create({
        key: "communication",
        label: "Communication",
        isActive: true
    });
    // Seed ScoringModel
    await ScoringModel_1.ScoringModel.create({
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
    const roleProfile = await RoleProfile_1.RoleProfile.create({
        name: "Backend Junior",
        experienceLevel: "junior",
        sections: [
            { sectionId: technical._id, weight: 60 },
            { sectionId: communication._id, weight: 40 }
        ],
        readinessThreshold: 70,
        isActive: true
    });
    const interviewService = new InterviewService_1.InterviewService();
    // Start Interview
    const session = await interviewService.startInterview({
        candidateId: "candidate-1",
        roleProfileId: roleProfile._id.toString(),
        level: "confidence"
    });
    logger_1.logger.info({ sessionId: session._id.toString() }, "Session started");
    // Complete Interview
    const result = await interviewService.completeInterview({
        sessionId: session._id.toString(),
        sectionScores: [
            { sectionId: technical._id.toString(), rawScore: 8 },
            { sectionId: communication._id.toString(), rawScore: 15 }
        ]
    });
    logger_1.logger.info({ result }, "Final Result");
    await mongoose_1.default.disconnect();
}
run();
