import { ErrorCodesEnum } from "../constants/enum.constants.js";
import StringConstants from "../constants/strings.constants.js";
const globalErrorHandler = async (error, req, res, next) => {
    return res.status(error.statusCode || 500).json({
        success: false,
        error: {
            code: error.code || ErrorCodesEnum.SERVER_ERROR,
            message: error.message || StringConstants.SOMETHING_WRONG_MESSAGE,
            details: error.details,
            cause: error.cause,
        },
    });
};
export default globalErrorHandler;
