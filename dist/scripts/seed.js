"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_process_1 = __importDefault(require("node:process"));
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const logger_1 = require("../core/logger");
const SectionDefinition_1 = require("../modules/scoring/models/SectionDefinition");
const ScoringModel_1 = require("../modules/scoring/models/ScoringModel");
const RoleProfile_1 = require("../modules/scoring/models/RoleProfile");
const InterviewSession_1 = require("../modules/interview/models/InterviewSession");
const SectionScore_1 = require("../modules/interview/models/SectionScore");
async function seed() {
    if (env_1.config.nodeEnv !== 'development') {
        throw new Error('Seeding is only allowed in development environment');
    }
    await (0, database_1.connectDatabase)();
    await Promise.all([
        SectionDefinition_1.SectionDefinition.deleteMany({}),
        ScoringModel_1.ScoringModel.deleteMany({}),
        RoleProfile_1.RoleProfile.deleteMany({}),
        InterviewSession_1.InterviewSession.deleteMany({}),
        SectionScore_1.SectionScore.deleteMany({}),
    ]);
    const [technical, communication] = await SectionDefinition_1.SectionDefinition.create([
        {
            key: 'technical',
            label: 'Technical',
            description: 'Technical skills and problem solving',
            isActive: true,
        },
        {
            key: 'communication',
            label: 'Communication',
            description: 'Communication and clarity',
            isActive: true,
        },
    ]);
    await ScoringModel_1.ScoringModel.create({
        version: 1,
        difficultyMultipliers: {
            confidence: 1.0,
            guided: 1.05,
            simulation: 1.1,
            stress: 1.15,
        },
        isActive: true,
    });
    await RoleProfile_1.RoleProfile.create({
        name: 'Backend Junior',
        experienceLevel: 'junior',
        sections: [
            { sectionId: technical._id, weight: 60 },
            { sectionId: communication._id, weight: 40 },
        ],
        readinessThreshold: 70,
        isActive: true,
    });
    logger_1.logger.info('Seed completed successfully');
}
void seed()
    .then(async () => {
    await mongoose_1.default.disconnect();
    node_process_1.default.exit(0);
})
    .catch(async (error) => {
    logger_1.logger.error({ error }, 'Seed failed');
    await mongoose_1.default.disconnect();
    node_process_1.default.exit(1);
});
