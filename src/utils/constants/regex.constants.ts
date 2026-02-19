class AppRegex {
  static readonly nameRegex = /^[A-Z][a-z]{1,24}$/;

  static readonly fullNameRegex = /^[A-Z][a-z]{1,24}\s[A-Z][a-z]{1,24}$/;

  static readonly passwordRegex =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\W).{8,}$/;

  static readonly otpRegex = /^\d{6}$/;

  static readonly tokenRegex = /^.+\..+\..+$/;

  static readonly bearerWithTokenRegex =
    /^(BUser|BSystem|BSuperSystem)\ .+\..+\..+$/;

  static readonly phoneNumberRegex = /^(\+20)(10|11|12|15)\d{8}$/;

  static readonly getFileWithUrlRegex =
    /^(users|careers)\/\w{1,50}\/.+\.(jpeg|jpg|png|gif)$/;

  static readonly quizTitleRegex = /^(?=.{3,200}$)[A-Z][a-z]+(\s[A-Z][a-z]+)*$/;

  static readonly fcmTokenRegex = /^[A-Za-z0-9_:\-]{20,4096}$/;

  static readonly deviceIdRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

  static readonly appVersionRegex = /^\d+(?:\.\d+){1,3}$/;

  static readonly osRegex = /^(Android|IOS|Web)\s\d{1,2}(\.\d{1,2})*$/;

  static readonly deviceModelRegex = /^[A-Za-z0-9][A-Za-z0-9\-_ ]{1,49}$/;

  static readonly careerTitleRegex =
    /^(?=.{3,100}$)[A-Z][a-z]+(?:[-\s][A-Z][a-z]+)*\s(?:Engineer|Developer|Scientist|Architect|Analyst|Administrator|Manager|Specialist|Consultant|Researcher|Tester|Auditor|Operator|Lead|Principal)(?:\s\([A-Za-z0-9 +\/#&.\-]{1,40}\))?$/;
  // [Domain Words] [Role Type] (Optional Focus)
  /*
  Examples:
   - Android Developer
   - Mobile Developer (iOS)
   - Machine Learning Engineer (AI/ML)
   - Flutter Developer
   - Design Developer (UI/UX)
   - Mobile Developer (iOS)
   - Backend Developer (C++)
   - Software Engineer (C#/.NET)
   - Data Scientist (NLP)
   - Platform Engineer (SRE)
  */
}

export default AppRegex;
