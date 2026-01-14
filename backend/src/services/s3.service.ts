import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';

class S3Service {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
  }

  async uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
    bucket: string = config.aws.s3Bucket
  ): Promise<{ url: string; key: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: 'public-read',
      });

      await this.s3Client.send(command);

      const url = `https://${bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;

      logger.info(`File uploaded to S3: ${key}`);

      return { url, key };
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new AppError('Failed to upload file', 500);
    }
  }

  async getSignedUrl(
    key: string,
    bucket: string = config.aws.s3Bucket,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return signedUrl;
    } catch (error) {
      logger.error('S3 signed URL error:', error);
      throw new AppError('Failed to generate signed URL', 500);
    }
  }

  async getUploadSignedUrl(
    key: string,
    contentType: string,
    bucket: string = config.aws.s3Bucket,
    expiresIn: number = 3600
  ): Promise<{ uploadUrl: string; key: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ACL: 'public-read',
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return { uploadUrl, key };
    } catch (error) {
      logger.error('S3 upload signed URL error:', error);
      throw new AppError('Failed to generate upload URL', 500);
    }
  }

  async deleteFile(key: string, bucket: string = config.aws.s3Bucket): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new AppError('Failed to delete file', 500);
    }
  }

  async fileExists(key: string, bucket: string = config.aws.s3Bucket): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  async getFileMetadata(
    key: string,
    bucket: string = config.aws.s3Bucket
  ): Promise<{ size: number; contentType: string; lastModified: Date } | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || '',
        lastModified: response.LastModified || new Date(),
      };
    } catch {
      return null;
    }
  }
}

export default new S3Service();
