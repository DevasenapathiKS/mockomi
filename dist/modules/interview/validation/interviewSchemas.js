"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeInterviewSchema = exports.startInterviewSchema = void 0;
const zod_1 = require("zod");
exports.startInterviewSchema = zod_1.z.object({
    candidateId: zod_1.z.string().min(1),
    roleProfileId: zod_1.z.string().min(1),
    level: zod_1.z.enum(['confidence', 'guided', 'simulation', 'stress']),
});
exports.completeInterviewSchema = zod_1.z.object({
    sectionScores: zod_1.z.array(zod_1.z.object({
        sectionId: zod_1.z.string().min(1),
        rawScore: zod_1.z.number().min(0).max(10),
    })),
});
