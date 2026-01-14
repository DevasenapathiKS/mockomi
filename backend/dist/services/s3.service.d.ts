declare class S3Service {
    private s3Client;
    constructor();
    uploadFile(file: Buffer, key: string, contentType: string, bucket?: string): Promise<{
        url: string;
        key: string;
    }>;
    getSignedUrl(key: string, bucket?: string, expiresIn?: number): Promise<string>;
    getUploadSignedUrl(key: string, contentType: string, bucket?: string, expiresIn?: number): Promise<{
        uploadUrl: string;
        key: string;
    }>;
    deleteFile(key: string, bucket?: string): Promise<void>;
    fileExists(key: string, bucket?: string): Promise<boolean>;
    getFileMetadata(key: string, bucket?: string): Promise<{
        size: number;
        contentType: string;
        lastModified: Date;
    } | null>;
}
declare const _default: S3Service;
export default _default;
//# sourceMappingURL=s3.service.d.ts.map