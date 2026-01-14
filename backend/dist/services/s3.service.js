"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const errors_1 = require("../utils/errors");
class S3Service {
    s3Client;
    constructor() {
        this.s3Client = new client_s3_1.S3Client({
            region: config_1.default.aws.region,
            credentials: {
                accessKeyId: config_1.default.aws.accessKeyId,
                secretAccessKey: config_1.default.aws.secretAccessKey,
            },
        });
    }
    async uploadFile(file, key, contentType, bucket = config_1.default.aws.s3Bucket) {
        try {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: file,
                ContentType: contentType,
                ACL: 'public-read',
            });
            await this.s3Client.send(command);
            const url = `https://${bucket}.s3.${config_1.default.aws.region}.amazonaws.com/${key}`;
            logger_1.default.info(`File uploaded to S3: ${key}`);
            return { url, key };
        }
        catch (error) {
            logger_1.default.error('S3 upload error:', error);
            throw new errors_1.AppError('Failed to upload file', 500);
        }
    }
    async getSignedUrl(key, bucket = config_1.default.aws.s3Bucket, expiresIn = 3600) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: bucket,
                Key: key,
            });
            const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
            return signedUrl;
        }
        catch (error) {
            logger_1.default.error('S3 signed URL error:', error);
            throw new errors_1.AppError('Failed to generate signed URL', 500);
        }
    }
    async getUploadSignedUrl(key, contentType, bucket = config_1.default.aws.s3Bucket, expiresIn = 3600) {
        try {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: bucket,
                Key: key,
                ContentType: contentType,
                ACL: 'public-read',
            });
            const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
            return { uploadUrl, key };
        }
        catch (error) {
            logger_1.default.error('S3 upload signed URL error:', error);
            throw new errors_1.AppError('Failed to generate upload URL', 500);
        }
    }
    async deleteFile(key, bucket = config_1.default.aws.s3Bucket) {
        try {
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            });
            await this.s3Client.send(command);
            logger_1.default.info(`File deleted from S3: ${key}`);
        }
        catch (error) {
            logger_1.default.error('S3 delete error:', error);
            throw new errors_1.AppError('Failed to delete file', 500);
        }
    }
    async fileExists(key, bucket = config_1.default.aws.s3Bucket) {
        try {
            const command = new client_s3_1.HeadObjectCommand({
                Bucket: bucket,
                Key: key,
            });
            await this.s3Client.send(command);
            return true;
        }
        catch {
            return false;
        }
    }
    async getFileMetadata(key, bucket = config_1.default.aws.s3Bucket) {
        try {
            const command = new client_s3_1.HeadObjectCommand({
                Bucket: bucket,
                Key: key,
            });
            const response = await this.s3Client.send(command);
            return {
                size: response.ContentLength || 0,
                contentType: response.ContentType || '',
                lastModified: response.LastModified || new Date(),
            };
        }
        catch {
            return null;
        }
    }
}
exports.default = new S3Service();
//# sourceMappingURL=s3.service.js.map