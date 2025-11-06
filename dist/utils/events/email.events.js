import CustomEvents from "./custom.events.js";
import { EventEmitter } from "node:events";
import { EventsEnum } from "../constants/enum.constants.js";
import EmailService from "../email/send.email.js";
import HTML_EMAIL_TEMPLATE from "../email/templates/html_email.template.js";
import StringConstants from "../constants/strings.constants.js";
const emailEvent = new CustomEvents(new EventEmitter());
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
                message: StringConstants.THANK_YOU_MESSAGE +
                    " " +
                    StringConstants.USE_EMAIL_VERIFICATION_LINK_MESSAGE,
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
                message: StringConstants.THANK_YOU_MESSAGE +
                    " " +
                    StringConstants.USE_FORGET_PASSWORD_OTP_MESSAGE,
                otpOrLink: payload.otpOrLink,
            }),
        });
    },
});
export default emailEvent;
