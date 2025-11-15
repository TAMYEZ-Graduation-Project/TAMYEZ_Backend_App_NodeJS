class AppRegex {
    static fullNameRegex = /^[A-Z][a-z]{1,24}\s[A-Z][a-z]{1,24}$/;
    static passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\W).{8,}$/;
    static otpRegex = /^\d{6}$/;
    static tokenRegex = /^.+\..+\..+$/;
    static bearerWithTokenRegex = /^(BUser|BSystem|BSuperSystem)\ .+\..+\..+$/;
    static phoneNumberRegex = /^(\+20)(10|11|12|15)\d{8}$/;
}
export default AppRegex;
