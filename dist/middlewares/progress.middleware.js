import UserCareerProgressModel from "../db/models/user_career_progress.model.js";
import UserCareerProgressRepository from "../db/repositories/user_career_progress.repository.js";
import { BadRequestException } from "../utils/exceptions/custom.exceptions.js";
import { ApplicationTypeEnum } from "../utils/constants/enum.constants.js";
async function loadUserProgressMiddleware(req, res, next) {
    if (!req.user ||
        req.tokenPayload?.applicationType !== ApplicationTypeEnum.user ||
        !req.user.careerPath?.id) {
        return next();
    }
    const progress = await new UserCareerProgressRepository(UserCareerProgressModel).findOne({
        filter: {
            userId: req.user._id,
            careerId: req.user.careerPath.id._id,
        },
        options: { populate: [{ path: "frontierStep", select: "_id order" }] },
    });
    if (!progress) {
        throw new BadRequestException("Can't resolve user progress ❌");
    }
    req.progress = progress;
    return next();
}
export default loadUserProgressMiddleware;
