import type { Request } from "express";

class StringConstants {
  static readonly GENERIC_ERROR_MESSAGE =
    "An unexpected error occurred. Please try again later. 🤔";

  static readonly SOMETHING_WRONG_MESSAGE = "Something went wrong. 🤔";

  static readonly CONNECTED_TO_DB_MESSAGE = `Connected to DB Successfully 👌`;

  static readonly FAILED_CONNECTED_TO_DB_MESSAGE = `Failed to Connect to DB ☠️`;

  static readonly DONE_MESSAGE = "Done ✅";

  static readonly EMAIL_CONTENT_MISSING_MESSAGE =
    "Can't Send Email, because Email Content is Missing 🔍";

  static readonly EMAIL_VERIFICATION_SUBJECT = "Email Verification ✉️";

  static readonly FORGET_PASSWORD_SUBJECT = "Forget Password 🔑";

  static readonly THANK_YOU_MESSAGE = "Thank you for using our Application ❤️.";

  static readonly USE_EMAIL_VERIFICATION_LINK_MESSAGE =
    "Please use the Link below to verify your Email.";

  static readonly USE_FORGET_PASSWORD_OTP_MESSAGE =
    "Please use the OTP below to verify your Forget Password Attempt.";

  static WRONG_ROUTE_MESSAGE(req: Request): string {
    return `Wrong URI ${req.url} or METHOD ${req.method} ⛔`;
  }

  static ERROR_STARTING_SERVER_MESSAGE(error: Error): string {
    return `Error Starting the Server ❌: ${error}`;
  }

  static SERVER_STARTED_MESSAGE(port: string): string {
    return `Server Started on PORT ${process.env.PORT} 🚀`;
  }

  static FAILED_EXECUTING_EVENT_MESSAGE(eventName: string, e: Error): string {
    return `Failed Executing ${eventName} Event ⚠️. Error: ${e}`;
  }
}
export default StringConstants;
