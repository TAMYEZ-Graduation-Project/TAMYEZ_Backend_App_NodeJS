import type { Types } from "mongoose";
import type { FullICareer } from "../../db/interfaces/career.interface.ts";
import type {
  FullIRoadmapStep,
  HIRoadmapStepType,
  IRoadmapStep,
} from "../../db/interfaces/roadmap_step.interface.ts";
import type {
  FullIUserCareerProgress,
  HIUserCareerProgress,
} from "../../db/interfaces/user_career_progress.interface.ts";
import { RoadmapStepProgressStatusEnum } from "../constants/enum.constants.ts";
import { BadRequestException } from "../exceptions/custom.exceptions.ts";
import type RoadmapStepRepository from "../../db/repositories/roadmap_step.repository.ts";
import type UserCareerProgressRepository from "../../db/repositories/user_career_progress.repository.ts";
import type { FullIUser } from "../../db/interfaces/user.interface.ts";

class UserProgressService {
  constructor(
    private _roadmapStepRepository: RoadmapStepRepository,
    private _userCareerProgressRepository: UserCareerProgressRepository,
  ) {}

  async getFirstNewStep({
    progress,
  }: {
    progress: HIUserCareerProgress | null;
  }): Promise<HIRoadmapStepType | null> {
    if (!progress?.frontierStep) return null;
    return this._roadmapStepRepository.findOne({
      filter: {
        order: {
          $lt: (progress.frontierStep as unknown as IRoadmapStep)?.order,
        },
        _id: { $nin: progress.completedSteps },
        careerId: progress.careerId,
      },
      options: { sort: { order: 1 }, select: { _id: 1, order: 1 } },
    });
  }

  // user progress classification logic
  private async _classifyStepInUserProgress({
    step,
    progress,
    career,
    firstNewStep,
  }: {
    step: FullIRoadmapStep;
    progress: FullIUserCareerProgress;
    career: FullICareer;
    firstNewStep: FullIRoadmapStep | null;
  }) {
    if (career.freezed) return RoadmapStepProgressStatusEnum.disabledFrozen;
    if (step.freezed) return RoadmapStepProgressStatusEnum.disabledFrozen;

    if (progress.completedSteps.includes(step._id))
      return RoadmapStepProgressStatusEnum.completed;

    if (progress.nextStep?.equals(step._id))
      if (progress.inProgressStep?.equals(step._id))
        return RoadmapStepProgressStatusEnum.inProgress;
      else return RoadmapStepProgressStatusEnum.available;

    if (
      progress.frontierStep &&
      step.order < (progress.frontierStep as unknown as IRoadmapStep).order
    ) {
      if (firstNewStep && firstNewStep._id.equals(step._id))
        if (progress.inProgressStep?.equals(step._id))
          return RoadmapStepProgressStatusEnum.inProgress;
        else return RoadmapStepProgressStatusEnum.available;
    }

    return RoadmapStepProgressStatusEnum.lockedPrereq;
  }

  private async _refreshUserProgress({
    progress,
    career,
    checkOrderEpochChanged = true,
  }: {
    progress: HIUserCareerProgress;
    career: FullICareer;
    checkOrderEpochChanged?: boolean;
  }): Promise<HIUserCareerProgress | undefined> {
    if (
      (checkOrderEpochChanged && progress.orderEpoch == career.orderEpoch) ||
      career.freezed
    )
      return;

    const frontierStep = await this._roadmapStepRepository.findOne({
      filter: {
        careerId: career._id,
        _id: { $in: progress.completedSteps },
      },
      options: { sort: { order: -1 }, select: { _id: 1, order: 1 } },
      // get the step with the highest order among completed steps
    });

    progress.frontierStep = frontierStep as unknown as Types.ObjectId;

    progress.nextStep = (
      await this._roadmapStepRepository.findOne({
        filter: {
          order: { $gt: frontierStep ? frontierStep.order : 0 },
          careerId: career._id,
        },
        options: { sort: { order: 1 }, select: { _id: 1 } },
      })
    )?._id;

    progress.percentageCompleted = Math.floor(
      (progress.completedSteps.length /
        (career.stepsCount -
          (await this._roadmapStepRepository.countDocuments({
            filter: {
              paranoid: false,
              freezed: { $exists: true },
              _id: { $nin: progress.completedSteps },
            },
          })))) *
        100,
    );

    progress.orderEpoch = career.orderEpoch;

    progress.increment();
    await progress.save();
    return progress;
  }

  async refreshProgressAndClassify({
    user,
    progress,
    stepOrSteps,
  }: {
    user: FullIUser;
    progress: HIUserCareerProgress;
    stepOrSteps: FullIRoadmapStep[] | FullIRoadmapStep;
  }): Promise<FullIRoadmapStep[] | FullIRoadmapStep> {
    if (!progress || !user?.careerPath?.id) {
      throw new BadRequestException("Can't resolve user progress ❌");
    }
    progress =
      (await this._refreshUserProgress({
        progress,
        career: user.careerPath.id as unknown as FullICareer,
      })) ?? progress;
    const firstNewStep = await this.getFirstNewStep({ progress });

    if (Array.isArray(stepOrSteps)) {
      for (const step of stepOrSteps) {
        (step as FullIRoadmapStep).progressStatus =
          await this._classifyStepInUserProgress({
            step: step as FullIRoadmapStep,
            progress,
            career: user.careerPath.id as unknown as FullICareer,
            firstNewStep,
          });
      }
      return stepOrSteps;
    } else {
      stepOrSteps.progressStatus = await this._classifyStepInUserProgress({
        step: stepOrSteps,
        progress,
        career: user.careerPath.id as unknown as FullICareer,
        firstNewStep,
      });
      return stepOrSteps;
    }
  }

  async addStepToCompletedAndRefreshProgress({
    user,
    stepId,
  }: {
    user: FullIUser;
    stepId: Types.ObjectId;
  }) {
    if (
      (
        await this._userCareerProgressRepository.updateOne({
          filter: {
            userId: user._id,
            careerId: (user.careerPath!.id as unknown as FullICareer)._id,
          },
          update: {
            $addToSet: {
              completedSteps: stepId,
            },
          },
        })
      ).matchedCount
    ) {
      await this._refreshUserProgress({
        progress: (await this._userCareerProgressRepository.findOne({
          filter: {
            userId: user._id,
            careerId: (user.careerPath!.id as unknown as FullICareer)._id,
          },
        }))!,
        career: user.careerPath!.id as unknown as FullICareer,
        checkOrderEpochChanged: false,
      });
    }
  }
}

export default UserProgressService;
