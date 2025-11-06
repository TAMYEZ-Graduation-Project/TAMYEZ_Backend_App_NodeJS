class StringConstants {
    static GENERIC_ERROR_MESSAGE = "An unexpected error occurred. Please try again later. 🤔";
    static SOMETHING_WRONG_MESSAGE = "Something went wrong. 🤔";
    static CONNECTED_TO_DB_MESSAGE = `Connected to DB Successfully 👌`;
    static FAILED_CONNECTED_TO_DB_MESSAGE = `Failed to Connect to DB ☠️`;
    static DONE_MESSAGE = "Done ✅";
    static EMAIL_CONTENT_MISSING_MESSAGE = "Can't Send Email, because Email Content is Missing 🔍";
    static EMAIL_VERIFICATION_SUBJECT = "Email Verification ✉️";
    static FORGET_PASSWORD_SUBJECT = "Forget Password 🔑";
    static THANK_YOU_MESSAGE = "Thank you for using our Application ❤️.";
    static USE_EMAIL_VERIFICATION_LINK_MESSAGE = "Please use the Link below to verify your Email.";
    static USE_FORGET_PASSWORD_OTP_MESSAGE = "Please use the OTP below to verify your Forget Password Attempt.";
    static WRONG_ROUTE_MESSAGE(req) {
        return `Wrong URI ${req.url} or METHOD ${req.method} ⛔`;
    }
    static ERROR_STARTING_SERVER_MESSAGE(error) {
        return `Error Starting the Server ❌: ${error}`;
    }
    static SERVER_STARTED_MESSAGE(port) {
        return `Server Started on PORT ${process.env.PORT} 🚀`;
    }
    static FAILED_EXECUTING_EVENT_MESSAGE(eventName, e) {
        return `Failed Executing ${eventName} Event ⚠️. Error: ${e}`;
    }
}
export default StringConstants;
