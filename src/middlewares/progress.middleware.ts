import type { NextFunction, Request, Response } from "express";
import UserCareerProgressModel from "../db/models/user_career_progress.model.ts";
import UserCareerProgressRepository from "../db/repositories/user_career_progress.repository.ts";
import type { FullICareer } from "../db/interfaces/career.interface.ts";
import { BadRequestException } from "../utils/exceptions/custom.exceptions.ts";
import { ApplicationTypeEnum } from "../utils/constants/enum.constants.ts";

async function loadUserProgressMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (
    !req.user ||
    req.tokenPayload?.applicationType !== ApplicationTypeEnum.user ||
    !req.user.careerPath?.id
  ) {
    return next();
  }
  const progress = await new UserCareerProgressRepository(
    UserCareerProgressModel,
  ).findOne({
    filter: {
      userId: req.user._id,
      careerId: (req.user.careerPath.id as unknown as FullICareer)._id,
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
