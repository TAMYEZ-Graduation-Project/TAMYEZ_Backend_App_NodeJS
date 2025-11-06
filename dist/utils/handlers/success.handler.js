import StringConstants from "../constants/strings.constants.js";
function successHandler({ res, statusCode = 200, message = StringConstants.DONE_MESSAGE, body, }) {
    return res.status(statusCode).json({ success: true, message, body });
}
export default successHandler;
