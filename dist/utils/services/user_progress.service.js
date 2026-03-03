import { RoadmapStepProgressStatusEnum } from "../constants/enum.constants.js";
import { BadRequestException } from "../exceptions/custom.exceptions.js";
class UserProgressService {
    _roadmapStepRepository;
    _userCareerProgressRepository;
    constructor(_roadmapStepRepository, _userCareerProgressRepository) {
        this._roadmapStepRepository = _roadmapStepRepository;
        this._userCareerProgressRepository = _userCareerProgressRepository;
    }
    async _getFirstNewStep({ progress, }) {
        if (!progress.frontierStep)
            return null;
        return this._roadmapStepRepository.findOne({
            filter: {
                order: {
                    $lt: progress.frontierStep?.order,
                },
                _id: { $nin: progress.completedSteps },
            },
            options: { sort: { order: 1 }, select: { _id: 1 } },
        });
    }
    async _classifyStepInUserProgress({ step, progress, career, firstNewStep, }) {
        if (career.freezed)
            return RoadmapStepProgressStatusEnum.disabledFrozen;
        if (step.freezed)
            return RoadmapStepProgressStatusEnum.disabledFrozen;
        if (progress.completedSteps.includes(step._id))
            return RoadmapStepProgressStatusEnum.completed;
        if (progress.nextStep?.equals(step._id))
            if (progress.inProgressStep?.equals(step._id))
                return RoadmapStepProgressStatusEnum.inProgress;
            else
                return RoadmapStepProgressStatusEnum.available;
        if (progress.frontierStep &&
            step.order < progress.frontierStep.order) {
            if (firstNewStep && firstNewStep._id.equals(step._id))
                if (progress.inProgressStep?.equals(step._id))
                    return RoadmapStepProgressStatusEnum.inProgress;
                else
                    return RoadmapStepProgressStatusEnum.available;
        }
        return RoadmapStepProgressStatusEnum.lockedPrereq;
    }
    async _refreshUserProgress({ progress, career, checkOrderEpochChanged = true, }) {
        if ((checkOrderEpochChanged && progress.orderEpoch == career.orderEpoch) ||
            career.freezed)
            return;
        const frontierStep = await this._roadmapStepRepository.findOne({
            filter: {
                careerId: career._id,
                _id: { $in: progress.completedSteps },
            },
            options: { sort: { order: -1 }, select: { _id: 1, order: 1 } },
        });
        progress.frontierStep = frontierStep?._id;
        progress.nextStep = (await this._roadmapStepRepository.findOne({
            filter: {
                order: { $gt: frontierStep ? frontierStep.order : 0 },
                careerId: career._id,
            },
            options: { sort: { order: 1 }, select: { _id: 1 } },
        }))?._id;
        progress.percentageCompleted =
            Math.floor(progress.completedSteps.length /
                (career.stepsCount -
                    (await this._roadmapStepRepository.countDocuments({
                        filter: {
                            paranoid: false,
                            freezed: { $exists: true },
                            _id: { $nin: progress.completedSteps },
                        },
                    })))) * 100;
        progress.orderEpoch = career.orderEpoch;
        progress.increment();
        await progress.save();
    }
    async refreshProgressAndClassify({ user, stepOrSteps, }) {
        const progress = await this._userCareerProgressRepository.findOne({
            filter: { userId: user._id },
        });
        if (!progress || !user?.careerPath?.id) {
            throw new BadRequestException("Can't resolve user progress ❌");
        }
        await this._refreshUserProgress({
            progress,
            career: user.careerPath.id,
        });
        const firstNewStep = await this._getFirstNewStep({ progress });
        if (Array.isArray(stepOrSteps)) {
            for (const step of stepOrSteps) {
                step.progressStatus =
                    await this._classifyStepInUserProgress({
                        step: step,
                        progress,
                        career: user.careerPath.id,
                        firstNewStep,
                    });
            }
            return stepOrSteps;
        }
        else {
            stepOrSteps.progressStatus = await this._classifyStepInUserProgress({
                step: stepOrSteps,
                progress,
                career: user.careerPath.id,
                firstNewStep,
            });
            return stepOrSteps;
        }
    }
    async addStepToCompletedAndRefreshProgress({ user, stepId, }) {
        if ((await this._userCareerProgressRepository.updateOne({
            filter: {
                userId: user._id,
                careerId: user.careerPath.id._id,
            },
            update: {
                $addToSet: {
                    completedSteps: stepId,
                },
            },
        })).matchedCount) {
            await this._refreshUserProgress({
                progress: (await this._userCareerProgressRepository.findOne({
                    filter: {
                        userId: user._id,
                        careerId: user.careerPath.id._id,
                    },
                })),
                career: user.careerPath.id,
                checkOrderEpochChanged: false,
            });
        }
    }
}
export default UserProgressService;
