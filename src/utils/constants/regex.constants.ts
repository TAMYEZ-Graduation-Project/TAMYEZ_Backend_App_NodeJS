class AppRegex {
  static readonly fullNameRegex = /^[A-Z][a-z]{1,24}\s[A-Z][a-z]{1,24}$/;

  static readonly passwordRegex =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\W).{8,}$/;

  static readonly otpRegex = /^\d{6}$/;

  static readonly tokenRegex = /^.+\..+\..+$/;

  static readonly bearerWithTokenRegex =
    /^(BUser|BSystem|BSuperSystem)\ .+\..+\..+$/;

  static readonly phoneNumberRegex = /^(\+20)(10|11|12|15)\d{8}$/;
}

export default AppRegex;
