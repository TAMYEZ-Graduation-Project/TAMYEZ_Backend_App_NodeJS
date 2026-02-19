class AppRegex {
    static nameRegex = /^[A-Z][a-z]{1,24}$/;
    static fullNameRegex = /^[A-Z][a-z]{1,24}\s[A-Z][a-z]{1,24}$/;
    static passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\W).{8,}$/;
    static otpRegex = /^\d{6}$/;
    static tokenRegex = /^.+\..+\..+$/;
    static bearerWithTokenRegex = /^(BUser|BSystem|BSuperSystem)\ .+\..+\..+$/;
    static phoneNumberRegex = /^(\+20)(10|11|12|15)\d{8}$/;
    static getFileWithUrlRegex = /^(users|careers)\/\w{1,50}\/.+\.(jpeg|jpg|png|gif)$/;
    static quizTitleRegex = /^(?=.{3,200}$)[A-Z][a-z]+(\s[A-Z][a-z]+)*$/;
    static fcmTokenRegex = /^[A-Za-z0-9_:\-]{20,4096}$/;
    static deviceIdRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    static appVersionRegex = /^\d+(?:\.\d+){1,3}$/;
    static osRegex = /^(Android|IOS|Web)\s\d{1,2}(\.\d{1,2})*$/;
    static deviceModelRegex = /^[A-Za-z0-9][A-Za-z0-9\-_ ]{1,49}$/;
    static careerTitleRegex = /^(?=.{3,100}$)[A-Z][a-z]+(?:[-\s][A-Z][a-z]+)*\s(?:Engineer|Developer|Scientist|Architect|Analyst|Administrator|Manager|Specialist|Consultant|Researcher|Tester|Auditor|Operator|Lead|Principal)(?:\s\([A-Za-z0-9 +\/#&.\-]{1,40}\))?$/;
}
export default AppRegex;
