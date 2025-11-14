abstract class EnvFields {
  static readonly MOOD = "MOOD";
  static readonly PORT = "PORT";
  static readonly APP_NAME = "APP_NAME";
  static readonly LOGO_URL = "LOGO_URL";
  static readonly PROTOCOL = "PROTOCOL";
  static readonly HOST = "HOST";

  // Database
  static readonly DB_URI = "DB_URI";

  // Email
  static readonly EMAIL_HOST = "EMAIL_HOST";
  static readonly EMAIL_PORT = "EMAIL_PORT";
  static readonly SERVICE = "SERVICE";
  static readonly IS_SECURE = "IS_SECURE";
  static readonly SENDER_EMAIL = "SENDER_EMAIL";
  static readonly APP_PASS = "APP_PASS";

  // Hashing
  static readonly SALT_ROUNDS = "SALT_ROUNDS";

  // Encryption
  static readonly ENCRYPTION_KEY = "ENCRYPTION_KEY";
  static readonly EMAIL_VERIFICATION_TOKEN_ENC_KEY =
    "EMAIL_VERIFICATION_TOKEN_ENC_KEY";

  // Token
  static readonly ACCESS_BUSER_TOKEN_SIGNATURE = "ACCESS_BUSER_TOKEN_SIGNATURE";
  static readonly ACCESS_BSYSTEM_TOKEN_SIGNATURE =
    "ACCESS_BSYSTEM_TOKEN_SIGNATURE";
  static readonly ACCESS_BSUPERSYSTEM_TOKEN_SIGNATURE =
    "ACCESS_BSUPERSYSTEM_TOKEN_SIGNATURE";
  static readonly ACCESS_TOKEN_EXPIRES_IN = "ACCESS_TOKEN_EXPIRES_IN";
  static readonly EMAIL_VERIFICATION_TOKEN_KEY = "EMAIL_VERIFICATION_TOKEN_KEY";

  static readonly EMAIL_VERIFICATION_TOKEN_EXPIRES_IN =
    "EMAIL_VERIFICATION_TOKEN_EXPIRES_IN";

  // OTP
  static readonly OTP_EXPIRES_IN_MILLISECONDS = "OTP_EXPIRES_IN_MILLISECONDS";
  static readonly WINDOW_PREFERED_TO_NEW_OTP_REQUST_IN_MILLISECONDS =
    "WINDOW_PREFERED_TO_NEW_OTP_REQUST_IN_MILLISECONDS";

  // Forget Password
  static readonly TIME_ELAPSED_TO_RESET_PASSWORD_IN_MILLISECONDS =
    "TIME_ELAPSED_TO_RESET_PASSWORD_IN_MILLISECONDS";
}

export default EnvFields;
