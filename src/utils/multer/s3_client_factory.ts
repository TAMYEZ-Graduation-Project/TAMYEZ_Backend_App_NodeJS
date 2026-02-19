import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import EnvFields from "../constants/env_fields.constants.ts";
import { BucketProvidersEnum } from "../constants/enum.constants.js";

class S3ClientFactory {
  static createS3Client({
    bucketProvider,
  }: {
    bucketProvider: BucketProvidersEnum;
  }): S3Client {
    const s3ClientConfig: S3ClientConfig = {};

    switch (bucketProvider) {
      case BucketProvidersEnum.aws:
        s3ClientConfig.region = process.env[EnvFields.AWS_REGION]!;
        s3ClientConfig.credentials = {
          accessKeyId: process.env[EnvFields.AWS_ACCESS_KEY_ID]!,
          secretAccessKey: process.env[EnvFields.AWS_SECRET_ACCESS_KEY]!,
        };
        break;
      case BucketProvidersEnum.cloudflare:
        s3ClientConfig.region = process.env[EnvFields.CLOUDFLARE_REGION]!;
        s3ClientConfig.endpoint = process.env[EnvFields.CLOUDFLARE_BUCKET_S3_API]!;
        s3ClientConfig.credentials = {
          accessKeyId: process.env[EnvFields.CLOUDFLARE_ACCESS_KEY_ID]!,
          secretAccessKey: process.env[EnvFields.CLOUDFLARE_SECRET_ACCESS_KEY]!,
        };
        break;
      default:
        throw new Error("Unsupported bucket provider");
    }

    return new S3Client({
      ...s3ClientConfig,
    });
  }
}

export default S3ClientFactory;
