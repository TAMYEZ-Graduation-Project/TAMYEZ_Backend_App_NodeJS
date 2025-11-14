class AppRegex {
    static fullNameRegex = /^[A-Z][a-z]{1,24}\s[A-Z][a-z]{1,24}$/;
    static passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\W).{8,}$/;
    static otpRegex = /^\d{6}$/;
}
export default AppRegex;
