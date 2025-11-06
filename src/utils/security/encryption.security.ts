import { AES } from "crypto-js";

class EncryptionSecurityUtil {
  static encryptText = ({
    plainText,
    secretKey = process.env.ENCRYPTION_KEY,
  }: {
    plainText: string;
    secretKey?: string;
  }): string => {
    return AES.encrypt(plainText, secretKey!).toString();
  };

  static decryptText = ({
    cipherText,
    secreteKey = process.env.ENCRYPTION_KEY,
  }: {
    cipherText: string;
    secreteKey?: string;
  }): string => {
    return AES.decrypt(cipherText, secreteKey!).toString();
  };
}

export default EncryptionSecurityUtil;
