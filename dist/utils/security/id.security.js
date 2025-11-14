import { customAlphabet, nanoid } from "nanoid";
class IdSecurityUtil {
    static generateNumericId = ({ size = 6 } = {}) => {
        return customAlphabet("0123456789", size)();
    };
    static generateAlphaNumericId = ({ size = 21, } = {}) => {
        return nanoid(size);
    };
}
export default IdSecurityUtil;
