import CustomEvents from "./custom.events.ts";
import { EventEmitter } from "node:events";
import type { IExtendedMailOptions } from "../constants/interface.constants.ts";
import { EmailEventsEnum } from "../constants/enum.constants.ts";
import EmailService from "../email/send.email.ts";
import HTML_EMAIL_TEMPLATE from "../email/templates/html_email.template.ts";
import StringConstants from "../constants/strings.constants.ts";

const emailEvent = new CustomEvents<IExtendedMailOptions, EmailEventsEnum>(new EventEmitter());

emailEvent.subscribe({
  eventName: EmailEventsEnum.emailVerification,
  bgFunction: (payload) => {
    const subject = StringConstants.EMAIL_VERIFICATION_SUBJECT;
    
    return EmailService.sendEmail({
      otpOrLink: payload.otpOrLink,
      to: payload.to,
      subject: subject,
      html: HTML_EMAIL_TEMPLATE({
        title: subject,
        message:
          StringConstants.THANK_YOU_MESSAGE +
          " " +
          StringConstants.USE_EMAIL_VERIFICATION_LINK_MESSAGE,
        logoUrl: process.env.LOGO_URL!,
        otpOrLink: payload.otpOrLink,
      }),
    });
  },
});

emailEvent.subscribe({
  eventName: EmailEventsEnum.forgetPassword,
  bgFunction: (payload) => {
    const subject = StringConstants.FORGET_PASSWORD_SUBJECT;

    return EmailService.sendEmail({
      otpOrLink: payload.otpOrLink,
      to: payload.to,
      subject: subject,
      html: HTML_EMAIL_TEMPLATE({
        title: subject,
        message:
          StringConstants.THANK_YOU_MESSAGE +
          " " +
          StringConstants.USE_FORGET_PASSWORD_OTP_MESSAGE,
        logoUrl: process.env.LOGO_URL!,
        otpOrLink: payload.otpOrLink,
      }),
    });
  },
});

export default emailEvent;
