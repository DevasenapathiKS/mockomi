"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFilename = exports.uploadFile = exports.uploadVideo = exports.uploadImages = exports.uploadImage = exports.uploadResume = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../config"));
const errors_1 = require("../utils/errors");
// File filter for resumes
const resumeFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errors_1.AppError('Only PDF, DOC, and DOCX files are allowed for resumes', 400));
    }
};
// File filter for images
const imageFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errors_1.AppError('Only JPEG, PNG, and WebP images are allowed', 400));
    }
};
// File filter for videos
const videoFilter = (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errors_1.AppError('Only MP4, WebM, and MOV videos are allowed', 400));
    }
};
// Memory storage for S3 uploads
const memoryStorage = multer_1.default.memoryStorage();
// Generate unique filename
const generateFilename = (file) => {
    const ext = path_1.default.extname(file.originalname);
    return `${(0, uuid_1.v4)()}${ext}`;
};
exports.generateFilename = generateFilename;
// Resume upload configuration
exports.uploadResume = (0, multer_1.default)({
    storage: memoryStorage,
    fileFilter: resumeFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1,
    },
});
// Image upload configuration
exports.uploadImage = (0, multer_1.default)({
    storage: memoryStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
        files: 1,
    },
});
// Multiple images upload
exports.uploadImages = (0, multer_1.default)({
    storage: memoryStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB per file
        files: 5,
    },
});
// Video upload configuration
exports.uploadVideo = (0, multer_1.default)({
    storage: memoryStorage,
    fileFilter: videoFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
        files: 1,
    },
});
// General file upload
exports.uploadFile = (0, multer_1.default)({
    storage: memoryStorage,
    limits: {
        fileSize: config_1.default.upload.maxFileSize,
        files: 1,
    },
});
//# sourceMappingURL=upload.js.map