import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, ObjectCannedACL, } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BucketProvidersEnum, StorageTypesEnum, } from "../constants/enum.constants.js";
import { createReadStream } from "node:fs";
import { S3Exception } from "../exceptions/custom.exceptions.js";
import S3KeyUtil from "./s3_key.multer.js";
import S3ClientFactory from "./s3_client_factory.js";
class S3Service {
    static _s3ClientObject = S3ClientFactory.createS3Client({
        bucketProvider: BucketProvidersEnum.cloudflare,
    });
    static uploadFile = async ({ StorageApproach = StorageTypesEnum.memory, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", Path = "general", File, }) => {
        const subKey = S3KeyUtil.generateS3SubKey({
            Path,
            originalname: File.originalname,
        });
        const command = new PutObjectCommand({
            Bucket,
            ACL,
            Key: S3KeyUtil.generateS3KeyFromSubKey(subKey),
            Body: StorageApproach === StorageTypesEnum.memory
                ? File.buffer
                : createReadStream(File.path),
            ContentType: File.mimetype,
        });
        await this._s3ClientObject.send(command).catch((error) => {
            throw new S3Exception(error, `Failed to upload file ☹️`);
        });
        if (!command.input.Key) {
            throw new S3Exception(undefined, "Failed to Retrieve Upload Key");
        }
        return subKey;
    };
    static uploadFiles = async ({ StorageApproach = StorageTypesEnum.memory, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", Path = "general", Files, }) => {
        const subKeys = await Promise.all(Files.map((File) => this.uploadFile({
            File,
            StorageApproach,
            Bucket,
            ACL,
            Path,
        })));
        if (subKeys.length == 0) {
            throw new S3Exception(undefined, "Failed to Retrieve Upload Keys");
        }
        return subKeys;
    };
    static uploadLargeFile = async ({ StorageApproach = StorageTypesEnum.disk, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", Path = "general", File, }) => {
        const subKey = S3KeyUtil.generateS3SubKey({
            Path,
            originalname: File.originalname,
        });
        const upload = new Upload({
            client: this._s3ClientObject,
            params: {
                Bucket,
                ACL,
                Key: S3KeyUtil.generateS3KeyFromSubKey(subKey),
                Body: StorageApproach === StorageTypesEnum.memory
                    ? File.buffer
                    : createReadStream(File.path),
                ContentType: File.mimetype,
            },
        });
        upload.on("httpUploadProgress", (progress) => {
            console.log("Large Upload File Progress:::", progress);
        });
        upload.done().catch((error) => {
            throw new S3Exception(error, `Failed to upload file ☹️.`);
        });
        const { Key } = await upload.done();
        if (!Key) {
            throw new S3Exception(undefined, "Failed to Retrieve Upload Key");
        }
        return subKey;
    };
    static uploadLargeFiles = async ({ StorageApproach = StorageTypesEnum.disk, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", Path = "general", Files, }) => {
        const subKeys = await Promise.all(Files.map((File) => this.uploadLargeFile({
            File,
            StorageApproach,
            Bucket,
            ACL,
            Path,
        })));
        if ((subKeys.length = 0)) {
            throw new S3Exception(undefined, "Failed to Retrieve Upload Keys");
        }
        return subKeys;
    };
    static createPresignedUploadUrl = async ({ Bucket = process.env.AWS_BUCKET_NAME, originalname, Path = "general", contentType, expiresIn = Number(process.env.AWS_PRESIGNED_URL_EXPIRES_IN_SECONDS), }) => {
        const subKey = S3KeyUtil.generateS3SubKey({
            Path,
            tag: "presigned",
            originalname,
        });
        const command = new PutObjectCommand({
            Bucket,
            Key: S3KeyUtil.generateS3KeyFromSubKey(subKey),
            ContentType: contentType,
        });
        const url = await getSignedUrl(this._s3ClientObject, command, {
            expiresIn,
        }).catch((error) => {
            throw new S3Exception(error, `Failed to create presigned upload url ☹️.`);
        });
        if (!url || !command.input.Key) {
            throw new S3Exception(undefined, "Failed to Create Presigned URL");
        }
        return { url, key: subKey };
    };
    static createPresignedGetUrl = async ({ Bucket = process.env.AWS_BUCKET_NAME, SubKey, expiresIn = Number(process.env.AWS_PRESIGNED_URL_EXPIRES_IN_SECONDS), download = "false", downloadName, }) => {
        const command = new GetObjectCommand({
            Bucket,
            Key: S3KeyUtil.generateS3KeyFromSubKey(SubKey),
            ResponseContentDisposition: download === "true"
                ? `attachment; filename="${downloadName
                    ? `${downloadName}.${SubKey.split(".").pop() ?? ""}`
                    : SubKey.split("/").pop()}"`
                : undefined,
        });
        const url = await getSignedUrl(this._s3ClientObject, command, {
            expiresIn,
        }).catch((error) => {
            throw new S3Exception(error, `Failed to create presigned get url ☹️.`);
        });
        if (!url || !command.input.Key) {
            throw new S3Exception(undefined, "Failed to Create Presigned URL");
        }
        return url;
    };
    static getFile = async ({ Bucket = process.env.AWS_BUCKET_NAME, SubKey, }) => {
        const command = new GetObjectCommand({
            Bucket,
            Key: S3KeyUtil.generateS3KeyFromSubKey(SubKey),
        });
        return this._s3ClientObject.send(command).catch((error) => {
            throw new S3Exception(error, `Failed to fetch this asset ☹️.`);
        });
    };
    static deleteFile = async ({ Bucket = process.env.AWS_BUCKET_NAME, SubKey, }) => {
        const command = new DeleteObjectCommand({
            Bucket,
            Key: S3KeyUtil.generateS3KeyFromSubKey(SubKey),
        });
        return this._s3ClientObject.send(command).catch((error) => {
            throw new S3Exception(error, `Failed to delete this asset ☹️.`);
        });
    };
    static deleteFiles = async ({ Bucket = process.env.AWS_BUCKET_NAME, Keys, SubKeys, Quiet, }) => {
        if (!Keys && !SubKeys) {
            throw new S3Exception(undefined, "No keys provided for deletion ☹️.");
        }
        const Objects = Keys
            ? Keys.map((Key) => {
                return { Key };
            })
            : SubKeys.map((SubKey) => {
                return { Key: S3KeyUtil.generateS3KeyFromSubKey(SubKey) };
            });
        const command = new DeleteObjectsCommand({
            Bucket,
            Delete: {
                Objects,
                Quiet,
            },
        });
        return this._s3ClientObject.send(command).catch((error) => {
            throw new S3Exception(error, `Failed to delete these assets ☹️.`);
        });
    };
    static listDirectoryFiles = async ({ Bucket = process.env.AWS_BUCKET_NAME, FolderPath, }) => {
        const command = new ListObjectsV2Command({
            Bucket,
            Prefix: S3KeyUtil.generateS3KeyFromSubKey(FolderPath),
        });
        const result = await this._s3ClientObject.send(command);
        return result;
    };
    static deleteFolderByPrefix = async ({ Bucket = process.env.AWS_BUCKET_NAME, FolderPath, Quiet, }) => {
        const listedObjects = await this.listDirectoryFiles({
            Bucket,
            FolderPath,
        });
        const Keys = listedObjects.Contents?.map((item) => item.Key);
        if (!Keys)
            return;
        return this.deleteFiles({ Bucket, Keys, Quiet });
    };
}
export default S3Service;
