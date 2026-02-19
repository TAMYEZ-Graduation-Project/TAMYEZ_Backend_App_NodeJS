import EnvFields from "../constants/env_fields.constants.ts";
import IdSecurityUtil from "../security/id.security.ts";

class S3KeyUtil {
  static generateS3Key = ({
    Path,
    tag,
    originalname,
  }: {
    Path: string;
    tag?: string | undefined;
    originalname: string;
  }): string => {
    return `${
      process.env.APP_NAME
    }/${Path}/${IdSecurityUtil.generateAlphaNumericId({
      size: 24,
    })}${tag ? `_${tag}` : ""}_${originalname}`;
  };

  static generateS3KeyFromSubKey = (subKey: string): string => {
    return `${process.env.APP_NAME}/${subKey}`;
  };

  static generateS3SubKey = ({
    Path,
    tag,
    originalname,
  }: {
    Path: string;
    tag?: string | undefined;
    originalname: string;
  }): string => {
    return `${Path}/${IdSecurityUtil.generateAlphaNumericId({
      size: 24,
    })}${tag ? `_${tag}` : ""}_${originalname}`;
  };

  static generateS3UploadsUrlFromSubKey = (
    subKey?: string,
  ): string | undefined => {
    if (!subKey) return undefined;
    return `${process.env[EnvFields.PROTOCOL]}://${
      process.env[EnvFields.HOST]
    }/uploads/${encodeURIComponent(subKey)}`;
  };
}

export default S3KeyUtil;
