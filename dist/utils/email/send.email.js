import { createTransport } from "nodemailer";
import { ApplicationException } from "../exceptions/custom.exceptions.js";
import { ErrorCodesEnum } from "../constants/enum.constants.js";
import StringConstants from "../constants/strings.constants.js";
import EnvFields from "../constants/env_fields.constants.js";
class EmailService {
    static _transporter = createTransport({
        host: process.env[EnvFields.EMAIL_HOST],
        port: Number(process.env.EMAIL_PORT),
        service: process.env.SERVICE,
        secure: process.env.IS_SECURE,
        auth: {
            user: process.env.SENDER_EMAIL,
            pass: process.env.APP_PASS,
        },
    });
    static sendEmail = async (data) => {
        if (!data.html && !data.attachments?.length && !data.text) {
            throw new ApplicationException(ErrorCodesEnum.RESOURCE_NOT_FOUND, 500, StringConstants.EMAIL_CONTENT_MISSING_MESSAGE);
        }
        await this._transporter.sendMail({
            ...data,
            from: `"${process.env.APP_NAME}" <${process.env.SENDER_EMAIL}>`,
        });
    };
}
export default EmailService;
