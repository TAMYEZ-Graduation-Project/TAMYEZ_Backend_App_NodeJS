import { createTransport, type TransportOptions } from "nodemailer";
import type { MailOptions } from "nodemailer/lib/json-transport/index.js";
import { ApplicationException } from "../exceptions/custom.exceptions.ts";
import { ErrorCodesEnum } from "../constants/enum.constants.ts";
import StringConstants from "../constants/strings.constants.ts";

class EmailService {
  private static _transporter = createTransport({
    host: process.env.HOST!,
    port: Number(process.env.EMAIL_PORT),
    service: process.env.SERVICE,
    secure: process.env.IS_SECURE,
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.APP_PASS,
    },
  } );

  static sendEmail = async (data: MailOptions) => {
    if (!data.html && !data.attachments?.length && !data.text) {
      throw new ApplicationException(
        ErrorCodesEnum.RESOURCE_NOT_FOUND,
        500,
        StringConstants.EMAIL_CONTENT_MISSING_MESSAGE
      );
    }
    await this._transporter.sendMail({
      ...data,
      from: `"${process.env.APP_NAME}" <${process.env.SENDER_EMAIL}>`,
    });
  };
}

export default EmailService;
