import { hash, compare } from "bcrypt";
class HashingSecurityUtil {
    static hashText = ({ plainText, salt = Number(process.env.HASH_SALT), }) => {
        return hash(plainText, salt);
    };
    static compareHash = ({ plainText, cipherText, }) => {
        return compare(plainText, cipherText);
    };
}
export default HashingSecurityUtil;
