import { CareerModel, RoadmapStepModel } from "../../db/models/index.js";
import { CareerRepository, RoadmapStepRepository, } from "../../db/repositories/index.js";
import successHandler from "../../utils/handlers/success.handler.js";
import { BadRequestException, ConflictException, NotFoundException, ServerException, } from "../../utils/exceptions/custom.exceptions.js";
import { startSession, Types } from "mongoose";
class RoadmapService {
    _careerRepository = new CareerRepository(CareerModel);
    _roadmapStepRepository = new RoadmapStepRepository(RoadmapStepModel);
    async checkAndUpdateOrder({ career, order, }) {
        if (order && order > 0) {
            if (order <= career.stepsCount && career.stepsCount > 0) {
                const session = await startSession();
                await session.withTransaction(async () => {
                    await this._roadmapStepRepository.updateMany({
                        filter: {
                            careerId: career._id,
                            order: { $gte: Number(order) },
                        },
                        update: {
                            $inc: { order: 500 },
                        },
                        options: { session },
                    });
                    await this._roadmapStepRepository.updateMany({
                        filter: { careerId: career._id, order: { $gt: 500 } },
                        update: {
                            $inc: { order: -499 },
                        },
                        options: { session },
                    });
                });
                session.endSession();
            }
            else if (order > career.stepsCount + 1) {
                throw new BadRequestException(`Step order must be sequential with no gaps. Current stepsCount is ${career.stepsCount} ❌`);
            }
        }
    }
    createRoadmapStep = async (req, res) => {
        const { careerId, title, order, description, courses, youtubePlaylists, books, } = req.validationResult.body;
        const career = await this._careerRepository.findOne({
            filter: { _id: careerId },
        });
        if (!career) {
            throw new NotFoundException("Invalid careerId or career freezed ❌");
        }
        const stepExists = await this._roadmapStepRepository.findOne({
            filter: { careerId, title },
        });
        if (stepExists) {
            throw new ConflictException("Step with this title already exists ❌");
        }
        await this.checkAndUpdateOrder({ career, order });
        const [newStep] = await this._roadmapStepRepository.create({
            data: [
                {
                    careerId: careerId,
                    title,
                    order: order ?? career.stepsCount + 1,
                    description,
                    courses,
                    youtubePlaylists,
                    books,
                },
            ],
        });
        if (!newStep) {
            throw new ServerException("Failed to create roadmap step, please try again ❌");
        }
        await this._careerRepository.updateOne({
            filter: { _id: careerId },
            update: { $inc: { stepsCount: 1 } },
        });
        return successHandler({
            res,
            message: "Roadmap step created successfully ✅",
        });
    };
    updateRoadmapStep = async (req, res) => {
        const { roadmapStepId } = req.params;
        const body = req.body;
        const roadmapStep = await this._roadmapStepRepository.findOne({
            filter: { _id: roadmapStepId },
            options: {
                populate: [{ path: "careerId", select: "freezed stepsCount" }],
            },
        });
        if (!roadmapStep || roadmapStep.careerId.freezed) {
            throw new NotFoundException("Invalid roadmapStepId, roadmapStep is freezed or its career is freezed ❌");
        }
        if (RoadmapService.getTotalResourceCount({
            currentResources: roadmapStep.courses,
            removeResources: body.removeCourses,
            newResourcesCount: body.courses?.length ?? 0,
        }) > 5 ||
            RoadmapService.getTotalResourceCount({
                currentResources: roadmapStep.youtubePlaylists,
                removeResources: body.removeYoutubePlaylists,
                newResourcesCount: body.youtubePlaylists?.length ?? 0,
            }) > 5 ||
            RoadmapService.getTotalResourceCount({
                currentResources: roadmapStep.books,
                removeResources: body.removeBooks,
                newResourcesCount: body.books?.length ?? 0,
            }) > 5) {
            throw new BadRequestException("Each career resource list (courses | youtubePlaylists | books) must be at most 5 items length ❌");
        }
        const session = await startSession();
        await session.withTransaction(async () => {
            if (body.order && body.order != roadmapStep.order) {
                await this._roadmapStepRepository.updateOne({
                    filter: {
                        careerId: roadmapStep.careerId._id,
                        order: body.order,
                    },
                    update: { $inc: { order: 600 } },
                    options: { session },
                });
            }
            const toUpdate = {};
            if (body.title)
                toUpdate.title = body.title;
            if (body.order && roadmapStep.order !== body.order)
                toUpdate.order = body.order;
            if (body.description)
                toUpdate.description = body.description;
            await this._roadmapStepRepository.updateOne({
                filter: { _id: roadmapStepId },
                update: [
                    { $set: { ...toUpdate } },
                    ...RoadmapService.buildUniqueAppendStages({
                        fieldName: "courses",
                        newItems: body.courses,
                        removeIds: body.removeCourses?.map((id) => Types.ObjectId.createFromHexString(id)),
                    }),
                    ...RoadmapService.buildUniqueAppendStages({
                        fieldName: "youtubePlaylists",
                        newItems: body.youtubePlaylists,
                        removeIds: body.removeYoutubePlaylists?.map((id) => Types.ObjectId.createFromHexString(id)),
                    }),
                    ...RoadmapService.buildUniqueAppendStages({
                        fieldName: "books",
                        newItems: body.books,
                        removeIds: body.removeBooks?.map((id) => Types.ObjectId.createFromHexString(id)),
                    }),
                ],
                options: { session },
            });
            if (body.order && body.order != roadmapStep.order) {
                await this._roadmapStepRepository.updateOne({
                    filter: {
                        careerId: roadmapStep.careerId._id,
                        order: body.order + 600,
                    },
                    update: { order: roadmapStep.order },
                    options: { session },
                });
            }
        });
        return successHandler({ res });
    };
    static getTotalResourceCount({ currentResources, removeResources, newResourcesCount, }) {
        if (currentResources.length === 0) {
            return newResourcesCount;
        }
        else if (!removeResources || !removeResources.length) {
            return currentResources.length + newResourcesCount;
        }
        let totalCourses = currentResources.length + newResourcesCount;
        for (const removeResource of removeResources) {
            if (currentResources.findIndex((c) => c._id.equals(removeResource)) !== -1) {
                totalCourses--;
            }
        }
        return totalCourses;
    }
    static buildUniqueAppendStages({ fieldName, removeIds, newItems, }) {
        const tmpTitles = `_${fieldName}_titles`;
        const tmpUrls = `_${fieldName}_urls`;
        const tmpToAdd = `_${fieldName}_toAdd`;
        if (!removeIds?.length && !newItems?.length) {
            return [];
        }
        const stages = [];
        if (removeIds?.length) {
            stages.push({
                $set: {
                    [fieldName]: {
                        $filter: {
                            input: `$${fieldName}`,
                            as: "it",
                            cond: { $not: { $in: ["$$it._id", removeIds] } },
                        },
                    },
                },
            });
        }
        if (newItems?.length) {
            stages.push({
                $set: {
                    [tmpTitles]: {
                        $map: { input: `$${fieldName}`, as: "it", in: "$$it.title" },
                    },
                    [tmpUrls]: {
                        $map: { input: `$${fieldName}`, as: "it", in: "$$it.url" },
                    },
                },
            }, {
                $set: {
                    [tmpToAdd]: {
                        $filter: {
                            input: newItems,
                            as: "ni",
                            cond: {
                                $and: [
                                    { $not: { $in: ["$$ni.title", `$${tmpTitles}`] } },
                                    { $not: { $in: ["$$ni.url", `$${tmpUrls}`] } },
                                ],
                            },
                        },
                    },
                },
            }, {
                $set: {
                    [tmpToAdd]: {
                        $map: {
                            input: `$${tmpToAdd}`,
                            as: "x",
                            in: {
                                $mergeObjects: [
                                    {
                                        _id: {
                                            $function: {
                                                body: "return new ObjectId();",
                                                args: [],
                                                lang: "js",
                                            },
                                        },
                                    },
                                    "$$x",
                                ],
                            },
                        },
                    },
                },
            }, {
                $set: {
                    [fieldName]: {
                        $concatArrays: [`$${fieldName}`, `$${tmpToAdd}`],
                    },
                },
            });
        }
        return [
            ...stages,
            { $unset: [tmpTitles, tmpUrls, tmpToAdd] },
        ];
    }
}
export default RoadmapService;
