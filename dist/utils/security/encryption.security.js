import CryptoJS from "crypto-js";
class EncryptionSecurityUtil {
    static encryptText = ({ plainText, secretKey = process.env.ENCRYPTION_KEY, }) => {
        return CryptoJS.AES.encrypt(plainText, secretKey).toString();
    };
    static decryptText = ({ cipherText, secretKey = process.env.ENCRYPTION_KEY, }) => {
        return CryptoJS.AES.decrypt(cipherText, secretKey).toString(CryptoJS.enc.Utf8);
    };
}
export default EncryptionSecurityUtil;
