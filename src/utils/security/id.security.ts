import { customAlphabet, nanoid } from "nanoid";

class IdSecurityUtil {
  static generateNumericId = ({ size = 6 }: { size?: number }): string => {
    return customAlphabet("0123456789", size)();
  };

  static generateAlphaNumericId = ({ size = 21 }: { size?: number }) => {
    return nanoid(size);
  };
}

export default IdSecurityUtil;
