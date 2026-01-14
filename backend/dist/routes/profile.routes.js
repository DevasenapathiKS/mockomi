"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const upload_1 = require("../middlewares/upload");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const types_1 = require("../types");
const validations_1 = require("../validations");
const router = (0, express_1.Router)();
// ============ JOB SEEKER PROFILE ============
/**
 * @swagger
 * /profiles/job-seeker:
 *   get:
 *     tags: [Profiles]
 *     summary: Get job seeker profile
 *     security: [{ bearerAuth: [] }]
 */
router.get('/job-seeker', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.JOB_SEEKER), controllers_1.profileController.getJobSeekerProfile);
/**
 * @swagger
 * /profiles/job-seeker:
 *   put:
 *     tags: [Profiles]
 *     summary: Update job seeker profile
 *     security: [{ bearerAuth: [] }]
 */
router.put('/job-seeker', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.JOB_SEEKER), (0, validate_1.validateBody)(validations_1.jobSeekerProfileSchema), controllers_1.profileController.updateJobSeekerProfile);
/**
 * @swagger
 * /profiles/job-seeker/resume:
 *   post:
 *     tags: [Profiles]
 *     summary: Upload resume
 *     security: [{ bearerAuth: [] }]
 */
router.post('/job-seeker/resume', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.JOB_SEEKER), rateLimiter_1.uploadLimiter, upload_1.uploadResume.single('resume'), controllers_1.profileController.uploadResume);
// ============ COMPANY PROFILE ============
/**
 * @swagger
 * /profiles/company:
 *   get:
 *     tags: [Profiles]
 *     summary: Get company profile
 *     security: [{ bearerAuth: [] }]
 */
router.get('/company', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), controllers_1.profileController.getCompanyProfile);
/**
 * @swagger
 * /profiles/company:
 *   post:
 *     tags: [Profiles]
 *     summary: Create company profile
 *     security: [{ bearerAuth: [] }]
 */
router.post('/company', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), (0, validate_1.validateBody)(validations_1.companyProfileSchema), controllers_1.profileController.createCompanyProfile);
/**
 * @swagger
 * /profiles/company:
 *   put:
 *     tags: [Profiles]
 *     summary: Update company profile
 *     security: [{ bearerAuth: [] }]
 */
router.put('/company', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), (0, validate_1.validateBody)(validations_1.companyProfileSchema.partial()), controllers_1.profileController.updateCompanyProfile);
/**
 * @swagger
 * /profiles/company/logo:
 *   post:
 *     tags: [Profiles]
 *     summary: Upload company logo
 *     security: [{ bearerAuth: [] }]
 */
router.post('/company/logo', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), rateLimiter_1.uploadLimiter, upload_1.uploadImage.single('logo'), controllers_1.profileController.uploadCompanyLogo);
// ============ INTERVIEWER PROFILE ============
/**
 * @swagger
 * /profiles/interviewer:
 *   get:
 *     tags: [Profiles]
 *     summary: Get interviewer profile
 *     security: [{ bearerAuth: [] }]
 */
router.get('/interviewer', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INTERVIEWER), controllers_1.profileController.getInterviewerProfile);
/**
 * @swagger
 * /profiles/interviewer:
 *   put:
 *     tags: [Profiles]
 *     summary: Update interviewer profile
 *     security: [{ bearerAuth: [] }]
 */
router.put('/interviewer', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.INTERVIEWER), (0, validate_1.validateBody)(validations_1.updateInterviewerProfileSchema), controllers_1.profileController.updateInterviewerProfile);
// ============ CANDIDATE SEARCH (EMPLOYER) ============
/**
 * @swagger
 * /profiles/candidates:
 *   get:
 *     tags: [Profiles]
 *     summary: Search candidates (Employer only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/candidates', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), controllers_1.profileController.searchCandidates);
/**
 * @swagger
 * /profiles/candidates/{id}:
 *   get:
 *     tags: [Profiles]
 *     summary: Get candidate details (Employer only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/candidates/:id', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.EMPLOYER), controllers_1.profileController.getCandidateDetails);
// ============ COMMON ============
/**
 * @swagger
 * /profiles/avatar:
 *   post:
 *     tags: [Profiles]
 *     summary: Upload avatar
 *     security: [{ bearerAuth: [] }]
 */
router.post('/avatar', auth_1.authenticate, rateLimiter_1.uploadLimiter, upload_1.uploadImage.single('avatar'), controllers_1.profileController.uploadAvatar);
/**
 * @swagger
 * /profiles/basic-info:
 *   put:
 *     tags: [Profiles]
 *     summary: Update basic info
 *     security: [{ bearerAuth: [] }]
 */
router.put('/basic-info', auth_1.authenticate, controllers_1.profileController.updateBasicInfo);
exports.default = router;
//# sourceMappingURL=profile.routes.js.map