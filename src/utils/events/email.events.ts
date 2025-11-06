import CustomEvents from "./custom.events.ts";
import { EventEmitter } from "node:events";
import type { IExtendedMailOptions } from "../constants/interface.constants.ts";
import { EventsEnum } from "../constants/enum.constants.ts";
import EmailService from "../email/send.email.ts";
import HTML_EMAIL_TEMPLATE from "../email/templates/html_email.template.ts";
import StringConstants from "../constants/strings.constants.ts";

const emailEvent = new CustomEvents<IExtendedMailOptions>(new EventEmitter());

emailEvent.subscribe({
  eventName: EventsEnum.emailVerification,
  bgFunction: (payload) => {
    console.log(payload);

    return EmailService.sendEmail({
      otpOrLink: payload.otpOrLink,
      to: payload.to,
      subject: payload.subject,
      html: HTML_EMAIL_TEMPLATE({
        title: payload.subject,
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
  eventName: EventsEnum.forgetPassword,
  bgFunction: (payload) => {
    return EmailService.sendEmail({
      otpOrLink: payload.otpOrLink,
      to: payload.to,
      subject: payload.subject,
      html: HTML_EMAIL_TEMPLATE({
        title: payload.subject,
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
