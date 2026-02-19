import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  ObjectCannedACL,
  type GetObjectOutput,
  type DeleteObjectCommandOutput,
  type DeleteObjectsCommandOutput,
  type ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { Progress } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  BucketProvidersEnum,
  StorageTypesEnum,
} from "../constants/enum.constants.ts";
import { createReadStream } from "node:fs";
import { S3Exception } from "../exceptions/custom.exceptions.ts";
import S3KeyUtil from "./s3_key.multer.ts";
import type { IMulterFile } from "../constants/interface.constants.ts";
import S3ClientFactory from "./s3_client_factory.ts";

abstract class S3Service {
  private static _s3ClientObject = S3ClientFactory.createS3Client({
    bucketProvider: BucketProvidersEnum.cloudflare,
  });

  static uploadFile = async ({
    StorageApproach = StorageTypesEnum.memory,
    Bucket = process.env.AWS_BUCKET_NAME!,
    ACL = "private",
    Path = "general",
    File,
  }: {
    StorageApproach?: StorageTypesEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    Path?: string;
    File: IMulterFile;
  }): Promise<string> => {
    const subKey = S3KeyUtil.generateS3SubKey({
      Path,
      originalname: File.originalname,
    });

    const command = new PutObjectCommand({
      Bucket,
      ACL,
      Key: S3KeyUtil.generateS3KeyFromSubKey(subKey),
      Body:
        StorageApproach === StorageTypesEnum.memory
          ? File.buffer!
          : createReadStream(File.path!),
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

  static uploadFiles = async ({
    StorageApproach = StorageTypesEnum.memory,
    Bucket = process.env.AWS_BUCKET_NAME!,
    ACL = "private",
    Path = "general",
    Files,
  }: {
    StorageApproach?: StorageTypesEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    Path?: string;
    Files: Express.Multer.File[];
  }): Promise<string[]> => {
    const subKeys = await Promise.all(
      Files.map(
        (File): Promise<string> =>
          this.uploadFile({
            File,
            StorageApproach,
            Bucket,
            ACL,
            Path,
          }),
      ),
    );
    if (subKeys.length == 0) {
      throw new S3Exception(undefined, "Failed to Retrieve Upload Keys");
    }
    return subKeys;
  };

  static uploadLargeFile = async ({
    StorageApproach = StorageTypesEnum.disk,
    Bucket = process.env.AWS_BUCKET_NAME,
    ACL = "private",
    Path = "general",
    File,
  }: {
    StorageApproach?: StorageTypesEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    Path?: string;
    File: Express.Multer.File;
  }): Promise<string> => {
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
        Body:
          StorageApproach === StorageTypesEnum.memory
            ? File.buffer
            : createReadStream(File.path),
        ContentType: File.mimetype,
      },
    });

    upload.on("httpUploadProgress", (progress: Progress) => {
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

  static uploadLargeFiles = async ({
    StorageApproach = StorageTypesEnum.disk,
    Bucket = process.env.AWS_BUCKET_NAME!,
    ACL = "private",
    Path = "general",
    Files,
  }: {
    StorageApproach?: StorageTypesEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    Path?: string;
    Files: Express.Multer.File[];
  }): Promise<string[]> => {
    const subKeys = await Promise.all(
      Files.map((File) =>
        this.uploadLargeFile({
          File,
          StorageApproach,
          Bucket,
          ACL,
          Path,
        }),
      ),
    );

    if ((subKeys.length = 0)) {
      throw new S3Exception(undefined, "Failed to Retrieve Upload Keys");
    }

    return subKeys;
  };

  static createPresignedUploadUrl = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    originalname,
    Path = "general",
    contentType,
    expiresIn = Number(process.env.AWS_PRESIGNED_URL_EXPIRES_IN_SECONDS),
  }: {
    Bucket?: string;
    originalname: string;
    Path?: string;
    contentType: string;
    expiresIn?: number;
  }): Promise<{ url: string; key: string }> => {
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

  static createPresignedGetUrl = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    SubKey,
    expiresIn = Number(process.env.AWS_PRESIGNED_URL_EXPIRES_IN_SECONDS),
    download = "false",
    downloadName,
  }: {
    Bucket?: string;
    SubKey: string;
    expiresIn?: number;
    download?: string | undefined;
    downloadName?: string | undefined;
  }): Promise<string> => {
    const command = new GetObjectCommand({
      Bucket,
      Key: S3KeyUtil.generateS3KeyFromSubKey(SubKey),
      ResponseContentDisposition:
        download === "true"
          ? `attachment; filename="${
              downloadName
                ? `${downloadName}.${SubKey.split(".").pop() ?? ""}`
                : SubKey.split("/").pop()
            }"`
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

  static getFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    SubKey,
  }: {
    Bucket?: string;
    SubKey: string;
  }): Promise<GetObjectOutput> => {
    const command = new GetObjectCommand({
      Bucket,
      Key: S3KeyUtil.generateS3KeyFromSubKey(SubKey),
    });

    return this._s3ClientObject.send(command).catch((error) => {
      throw new S3Exception(error, `Failed to fetch this asset ☹️.`);
    });
  };

  static deleteFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    SubKey,
  }: {
    Bucket?: string;
    SubKey: string;
  }): Promise<DeleteObjectCommandOutput> => {
    const command = new DeleteObjectCommand({
      Bucket,
      Key: S3KeyUtil.generateS3KeyFromSubKey(SubKey),
    });

    return this._s3ClientObject.send(command).catch((error) => {
      throw new S3Exception(error, `Failed to delete this asset ☹️.`);
    });
  };

  static deleteFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    Keys,
    SubKeys,
    Quiet,
  }: {
    Bucket?: string | undefined;
    Keys?: string[];
    SubKeys?: string[];
    Quiet?: boolean | undefined;
  }): Promise<DeleteObjectsCommandOutput> => {
    // Objects = [{Key:""},{Key:""}]
    if (!Keys && !SubKeys) {
      throw new S3Exception(undefined, "No keys provided for deletion ☹️.");
    }
    const Objects = Keys
      ? Keys!.map<{ Key: string }>((Key) => {
          return { Key };
        })
      : SubKeys!.map<{ Key: string }>((SubKey) => {
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

  static listDirectoryFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    FolderPath,
  }: {
    FolderPath: string;
    Bucket?: string | undefined;
  }): Promise<ListObjectsV2CommandOutput> => {
    const command = new ListObjectsV2Command({
      Bucket,
      Prefix: S3KeyUtil.generateS3KeyFromSubKey(FolderPath),
    });

    const result = await this._s3ClientObject.send(command);

    return result;
  };

  static deleteFolderByPrefix = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    FolderPath,
    Quiet,
  }: {
    Bucket?: string;
    FolderPath: string;
    Quiet?: boolean;
  }): Promise<DeleteObjectsCommandOutput | undefined> => {
    // List all objects with the given prefix
    const listedObjects = await this.listDirectoryFiles({
      Bucket,
      FolderPath,
    });

    const Keys = listedObjects.Contents?.map((item) => item.Key!);
    if (!Keys) return;

    return this.deleteFiles({ Bucket, Keys, Quiet });
  };
}

export default S3Service;
