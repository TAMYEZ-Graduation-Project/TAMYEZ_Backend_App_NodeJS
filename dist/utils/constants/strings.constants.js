import { GenderEnum, QuizTypesEnum, SignatureLevelsEnum, } from "./enum.constants.js";
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
    static INVALID_EMAIL_MESSAGE = "Invalid email address ✉️❌";
    static INVALID_USER_ACCOUNT_MESSAGE = "Invalid user account ⚠️";
    static INVALID_LOGIN_CREDENTIALS_MESSAGE = "Invalid login credentials 🪪";
    static NAME_VALIDATION_MESSAGE = "Name must start with a capital letter and 2-25 characters long 📛";
    static FULL_NAME_VALIDATION_MESSAGE = "Full name must be at least 2 words, each starting with a capital letter and 2-25 characters long 📛";
    static PASSWORD_VALIDATION_MESSAGE = "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number and one special character 🔑";
    static MISMATCH_CONFIRM_PASSWORD_MESSAGE = "confirmPassword mismatch password ☹️";
    static INVALID_GENDER_MESSAGE = `Invalid gender, it must be either [${Object.values(GenderEnum)}] 🚻`;
    static SINGED_UP_SUCCESSFUL_WITH_LINK_MESSAGE = "Signed up Successfully! Please check your email for verification link 🔗✉️";
    static SINGED_UP_SUCCESSFUL_MESSAGE = "Signed Up Successfully ✅";
    static LOG_IN_SUCCESSFUL_MESSAGE = "Logged In Successfully ✅";
    static FAILED_CREATE_INSTANCE_MESSAGE = "Failed to create instanc(s) ❌";
    static EMAIL_VERIFICATION_LINK_EXPIRE_MESSAGE = "Email Verification Link has expired ⏰";
    static RESENT_EMAIL_VERIFICATION_LINK_MESSAGE = "Email verification link has be resent to your email 🔗✉️";
    static INVALID_EMAIL_ACCOUNT_OR_VARIFIED_MESSAGE = "Invalid email account or already verified ❌";
    static INVALID_OTP_VALIDATION_MESSAGE = "Invalid OTP! OTP must consists only of 6 digits 🔒";
    static INVALID_OTP_MESSAGE = "Invalid OTP or has expired 🔑 ⏰";
    static INVALID_TOKEN_MESSAGE = "Invalid Token ⛔";
    static MISSING_TOKEN_PARTS_MESSAGE = "Missing Token Parts ⛔";
    static INVALID_TOKEN_PAYLOAD_MESSAGE = "Invalid Token Payload ❌";
    static TOKEN_REVOKED_MESSAGE = "Token as been Revoked ☠️";
    static INVALID_FILE_PATH_MESSAGE = "Invalid file path ❌";
    static INVALID_BEARER_KEY_MESSAGE = "Invalid Bearer Key 🚫";
    static OTP_SENT_MESSAGE = "OTP has been sent to your email 🔑";
    static OTP_VERIFIED_MESSAGE = "OTP verified successfully 🔑 ✅";
    static FORGET_PASSWORD_VERIFICATION_EXPIRE_MESSAGE = "Forget Password Verification has expired ⏰";
    static PASSWORD_RESET_SUCCESSFULLY_MESSAGE = "Password has been reset successfully 🔒 ✅";
    static RESET_PASSWORD_RECENTLY_MESSAGE = "You have reset your password recenty please try after 24 hours from last time ⏳";
    static TRY_AFTER_A_WHILE_MESSAGE = "Please try after a while 🕰️";
    static INVALID_VALIDATION_TOKEN_MESSAGE = `Token must consist of three parts having any characters accept line terimantors, each part seperated with dot ❌`;
    static INVALID_VALIDATION_BEARER_TOKEN_MESSAGE = `Token must start with one of ${Object.values(SignatureLevelsEnum)} followed by a space, and ${this.INVALID_VALIDATION_TOKEN_MESSAGE}`;
    static FAILED_VERIFY_GMAIL_ACCOUNT_MESSAGE = "Failed to verify this gmail account 🇬✉️";
    static INVALID_GMAIL_CREDENTIALS_MESSAGE = "Invaild gmail account credentials 🇬🪪";
    static EMAIL_EXISTS_PROVIDER_MESSAGE = "Email exists with another provider ✉️❌";
    static PHONE_NUMBER_VALIDATION_MESSAGE = "Phone number must start with country code (+20) followed by one of the code [10,11,12,15] followed by 8 digits 📱🔢 ❌";
    static NOT_AUTHORIZED_ACCOUNT_MESSAGE = "Not Authorized Account ⛔";
    static ATTACHMENT_FIELD_NAME = "attachment";
    static INVALID_VALIDATION_DURATION_MESSAGE = "duration must be an integer number between 60s and 36_000s 🕛";
    static INVALID_DURATION_EXIST_MESSAGE = `${QuizTypesEnum.careerAssessment} must not have a duration value 🕛`;
    static FAILED_REVOKE_TOKEN_MESSAGE = "Failed to revoke Token(s) ☠️";
    static CAREER_ASSESSMENT = "Career Assessment";
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
    static PATH_REQUIRED_MESSAGE(pathName) {
        return `${pathName} is required 🚫`;
    }
    static PATH_NOEMPTY_MESSAGE(pathName) {
        return `${pathName} must not be empty 🚫`;
    }
    static REQUEST_KEY_REQUIRED_MESSAGE(requestKey) {
        return `${requestKey.toString()} parameters are required 🚫`;
    }
    static INVALID_FILE_MIMETYPE_MESSAGE(allowedMimeTypes) {
        return `Invalid file mimeType 📁❌! Allowd types are ${allowedMimeTypes}`;
    }
    static INVALID_PARAMETER_MESSAGE(idName = "id") {
        return `Invalid ${idName} ❌`;
    }
    static INVALID_ENUM_VALUE_MESSAGE({ enumValueName, theEnum, }) {
        return `Invalid ${enumValueName}, allowed values are ${Object.values(theEnum)}`;
    }
    static CREATED_SUCCESSFULLY_MESSAGE(item) {
        return `${item} Created Successfully ✅`;
    }
    static TAMYEZ_LOGO_PATH = "/assets/TAMYEZ_logo.png";
}
export default StringConstants;
