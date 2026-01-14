"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const index_1 = __importDefault(require("./index"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Mockomi API',
            version: '1.0.0',
            description: `
# Mockomi - Job Portal Platform with Mock Interview System

## Overview
Mockomi is a comprehensive job portal platform that connects job seekers, employers, and interviewers. 
It features a unique mock interview system where job seekers can practice interviews with approved interviewers.

## Features
- **Job Seekers**: Create profiles, search and apply for jobs, schedule mock interviews
- **Employers**: Post jobs, search candidates, manage applications
- **Interviewers**: Conduct mock interviews, provide feedback, earn money
- **Admin**: Manage users, approve interviewers, view analytics

## Authentication
Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

## Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- File uploads: 10 requests per hour
      `,
            contact: {
                name: 'Mockomi Support',
                email: 'support@mockomi.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: `http://localhost:${index_1.default.port}/api/v1`,
                description: 'Development server',
            },
            {
                url: 'https://api.mockomi.com/api/v1',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT access token',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' },
                        errors: { type: 'array', items: { type: 'object' } },
                    },
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        total: { type: 'integer', example: 100 },
                        pages: { type: 'integer', example: 10 },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        phone: { type: 'string' },
                        role: {
                            type: 'string',
                            enum: ['job_seeker', 'employer', 'interviewer', 'admin'],
                        },
                        avatar: { type: 'string', format: 'uri' },
                        isEmailVerified: { type: 'boolean' },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Job: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        title: { type: 'string' },
                        company: { $ref: '#/components/schemas/Company' },
                        description: { type: 'string' },
                        requirements: { type: 'array', items: { type: 'string' } },
                        skills: { type: 'array', items: { type: 'string' } },
                        jobType: {
                            type: 'string',
                            enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
                        },
                        experienceLevel: {
                            type: 'string',
                            enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
                        },
                        location: {
                            type: 'object',
                            properties: {
                                city: { type: 'string' },
                                state: { type: 'string' },
                                country: { type: 'string' },
                                remote: { type: 'boolean' },
                            },
                        },
                        salary: {
                            type: 'object',
                            properties: {
                                min: { type: 'number' },
                                max: { type: 'number' },
                                currency: { type: 'string', default: 'INR' },
                                period: { type: 'string', enum: ['hourly', 'monthly', 'yearly'] },
                            },
                        },
                        status: {
                            type: 'string',
                            enum: ['draft', 'published', 'closed', 'expired'],
                        },
                        applicationDeadline: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Company: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        userId: { type: 'string' },
                        companyName: { type: 'string' },
                        website: { type: 'string', format: 'uri' },
                        industry: { type: 'string' },
                        companySize: { type: 'string' },
                        logo: { type: 'string', format: 'uri' },
                        description: { type: 'string' },
                        isVerified: { type: 'boolean' },
                    },
                },
                JobSeekerProfile: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        userId: { type: 'string' },
                        headline: { type: 'string' },
                        summary: { type: 'string' },
                        skills: { type: 'array', items: { type: 'string' } },
                        education: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    institution: { type: 'string' },
                                    degree: { type: 'string' },
                                    field: { type: 'string' },
                                    startDate: { type: 'string', format: 'date' },
                                    endDate: { type: 'string', format: 'date' },
                                    current: { type: 'boolean' },
                                },
                            },
                        },
                        experience: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    company: { type: 'string' },
                                    title: { type: 'string' },
                                    location: { type: 'string' },
                                    startDate: { type: 'string', format: 'date' },
                                    endDate: { type: 'string', format: 'date' },
                                    current: { type: 'boolean' },
                                    description: { type: 'string' },
                                },
                            },
                        },
                        resume: {
                            type: 'object',
                            properties: {
                                url: { type: 'string', format: 'uri' },
                                filename: { type: 'string' },
                                uploadedAt: { type: 'string', format: 'date-time' },
                            },
                        },
                    },
                },
                Interview: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        jobSeeker: { $ref: '#/components/schemas/User' },
                        interviewer: { $ref: '#/components/schemas/User' },
                        scheduledAt: { type: 'string', format: 'date-time' },
                        duration: { type: 'integer', description: 'Duration in minutes' },
                        type: {
                            type: 'string',
                            enum: ['technical', 'behavioral', 'system_design', 'hr', 'coding', 'general'],
                        },
                        topics: { type: 'array', items: { type: 'string' } },
                        status: {
                            type: 'string',
                            enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
                        },
                        feedback: {
                            type: 'object',
                            properties: {
                                overallRating: { type: 'number', minimum: 1, maximum: 5 },
                                technicalSkills: { type: 'number', minimum: 1, maximum: 5 },
                                communicationSkills: { type: 'number', minimum: 1, maximum: 5 },
                                problemSolving: { type: 'number', minimum: 1, maximum: 5 },
                                strengths: { type: 'string' },
                                areasOfImprovement: { type: 'string' },
                                recommendation: { type: 'string' },
                                submittedAt: { type: 'string', format: 'date-time' },
                            },
                        },
                        recording: {
                            type: 'object',
                            properties: {
                                url: { type: 'string', format: 'uri' },
                                duration: { type: 'integer' },
                            },
                        },
                        isPaid: { type: 'boolean' },
                        amount: { type: 'number' },
                    },
                },
                Application: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        job: { $ref: '#/components/schemas/Job' },
                        applicant: { $ref: '#/components/schemas/User' },
                        status: {
                            type: 'string',
                            enum: ['pending', 'reviewed', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn'],
                        },
                        coverLetter: { type: 'string' },
                        resume: { type: 'string', format: 'uri' },
                        appliedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Payment: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        user: { type: 'string' },
                        interview: { type: 'string' },
                        amount: { type: 'number' },
                        currency: { type: 'string', default: 'INR' },
                        razorpayOrderId: { type: 'string' },
                        razorpayPaymentId: { type: 'string' },
                        status: {
                            type: 'string',
                            enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Notification: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        user: { type: 'string' },
                        type: { type: 'string' },
                        title: { type: 'string' },
                        message: { type: 'string' },
                        data: { type: 'object' },
                        isRead: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
            responses: {
                BadRequest: {
                    description: 'Bad request - invalid input data',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
                Unauthorized: {
                    description: 'Unauthorized - authentication required',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
                Forbidden: {
                    description: 'Forbidden - insufficient permissions',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
                NotFound: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
                TooManyRequests: {
                    description: 'Rate limit exceeded',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
                InternalServerError: {
                    description: 'Internal server error',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
            },
        },
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Jobs', description: 'Job posting and search' },
            { name: 'Applications', description: 'Job applications' },
            { name: 'Interviews', description: 'Mock interview system' },
            { name: 'Profile', description: 'User profile management' },
            { name: 'Payments', description: 'Payment processing' },
            { name: 'Notifications', description: 'User notifications' },
            { name: 'Admin', description: 'Admin dashboard and management' },
        ],
    },
    apis: ['./src/routes/*.ts'],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.default = swaggerSpec;
//# sourceMappingURL=swagger.js.map