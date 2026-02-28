import type { Types } from "mongoose";
import type { FullICareer } from "../../db/interfaces/career.interface.ts";
import type {
  FullIRoadmapStep,
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
import type CareerRepository from "../../db/repositories/career.repository.ts";

class UserProgressService {
  constructor(
    private _roadmapStepRepository: RoadmapStepRepository,
    private _userCareerProgressRepository: UserCareerProgressRepository,
    private _careerRepository: CareerRepository,
  ) {}

  // user progress classification logic
  private async _classifyStepInUserProgress({
    step,
    progress,
    career,
  }: {
    step: FullIRoadmapStep;
    progress: FullIUserCareerProgress;
    career: FullICareer;
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
      const firstNewStep = await this._roadmapStepRepository.findOne({
        filter: {
          order: {
            $lt: (progress.frontierStep as unknown as IRoadmapStep).order,
          },
          _id: { $nin: progress.completedSteps },
        },
        options: { sort: { order: 1 }, select: { _id: 1 } },
      });
      if (firstNewStep && firstNewStep._id.equals(step._id))
        if (progress.inProgressStep?.equals(step._id))
          return RoadmapStepProgressStatusEnum.inProgress;
        else return RoadmapStepProgressStatusEnum.available;
    }

    return RoadmapStepProgressStatusEnum.lockedPrereq;
  }

  private async _refreshUserProgressWhenOrderEpochChange({
    progress,
    career,
  }: {
    progress: HIUserCareerProgress;
    career: FullICareer;
  }) {
    if (progress.orderEpoch == career.orderEpoch || career.freezed) return;

    const frontierStep = await this._roadmapStepRepository.findOne({
      filter: {
        careerId: career._id,
        _id: { $in: progress.completedSteps },
      },
      options: { sort: { order: -1 }, select: { _id: 1, order: 1 } },
      // get the step with the highest order among completed steps
    });

    progress.frontierStep = frontierStep?._id;

    progress.nextStep = (
      await this._roadmapStepRepository.findOne({
        filter: {
          order: { $gt: frontierStep ? frontierStep.order : 0 },
          careerId: career._id,
        },
        options: { sort: { order: 1 }, select: { _id: 1 } },
      })
    )?._id;

    progress.percentageCompleted =
      (progress.completedSteps.length /
        (career.stepsCount -
          (await this._roadmapStepRepository.countDocuments({
            filter: {
              paranoid: false,
              freezed: { $exists: true },
              _id: { $nin: progress.completedSteps },
            },
          })))) *
      100;

    progress.orderEpoch = career.orderEpoch;

    progress.increment();
    await progress.save();
  }

  async refreshProgressAndClassify({
    userId,
    careerId,
    stepOrSteps,
  }: {
    userId: Types.ObjectId;
    careerId: Types.ObjectId;
    stepOrSteps: FullIRoadmapStep[] | FullIRoadmapStep;
  }): Promise<FullIRoadmapStep[] | FullIRoadmapStep> {
    const [progress, career] = await Promise.all([
      this._userCareerProgressRepository.findOne({
        filter: { userId },
      }),
      this._careerRepository.findOne({
        filter: { _id: careerId, paranoid: false },
      }),
    ]);
    if (!progress || !career) {
      throw new BadRequestException("Can't resolve user progress ❌");
    }
    await this._refreshUserProgressWhenOrderEpochChange({
      progress,
      career,
    });
    if (Array.isArray(stepOrSteps)) {
      for (const step of stepOrSteps) {
        (step as FullIRoadmapStep).progressStatus =
          await this._classifyStepInUserProgress({
            step: step as FullIRoadmapStep,
            progress,
            career,
          });
      }
      return stepOrSteps;
    } else {
      stepOrSteps.progressStatus = await this._classifyStepInUserProgress({
        step: stepOrSteps,
        progress,
        career,
      });
      return stepOrSteps;
    }
  }
}

export default UserProgressService;
