import { hash, compare } from "bcryptjs";

class HashingSecurityUtil {
  static hashText = ({
    plainText,
    salt = Number(process.env.HASH_SALT),
  }: {
    plainText: string;
    salt?: number;
  }): Promise<string> => {
    return hash(plainText, salt);
  };

  static compareHash = ({
    plainText,
    cipherText,
  }: {
    plainText: string;
    cipherText: string;
  }): Promise<boolean> => {
    return compare(plainText, cipherText);
  };
}

export default HashingSecurityUtil;
