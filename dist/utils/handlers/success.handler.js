import StringConstants from "../constants/strings.constants.js";
function successHandler({ req, res, statusCode = 200, message = StringConstants.DONE_MESSAGE, body, }) {
    if (req.timedout ||
        res.headersSent ||
        res.writableEnded) {
        return;
    }
    return res.status(statusCode).json({ success: true, message, body });
}
export default successHandler;
