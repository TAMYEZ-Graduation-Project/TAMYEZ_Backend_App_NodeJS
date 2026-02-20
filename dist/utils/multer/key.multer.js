import IdSecurityUtil from "../security/id.security.js";
class S3KeyUtil {
    static generateS3Key = ({ Path, tag, originalname, }) => {
        return `${process.env.APP_NAME}/${Path}/${IdSecurityUtil.generateAlphaNumericId({
            size: 24,
        })}${tag ? `_${tag}` : ""}_${originalname}`;
    };
    static generateS3KeyFromSubKey = (subKey) => {
        return `${process.env.APP_NAME}/${subKey}`;
    };
    static generateS3SubKey = ({ Path, tag, originalname, }) => {
        return `${Path}/${IdSecurityUtil.generateAlphaNumericId({
            size: 24,
        })}${tag ? `_${tag}` : ""}_${originalname}`;
    };
    static generateS3UploadsUrlFromSubKey = ({ req, subKey, }) => {
        return `${req.protocol}://${req.host}/uploads/${subKey}`;
    };
}
export default S3KeyUtil;
