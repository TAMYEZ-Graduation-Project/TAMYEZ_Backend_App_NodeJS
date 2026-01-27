import { CareerModel, QuizModel, RoadmapStepModel, } from "../../db/models/index.js";
import { CareerRepository, QuizRepository, RoadmapStepRepository, } from "../../db/repositories/index.js";
import successHandler from "../../utils/handlers/success.handler.js";
import { BadRequestException, ConflictException, NotFoundException, ServerException, } from "../../utils/exceptions/custom.exceptions.js";
import { startSession, Types } from "mongoose";
import S3Service from "../../utils/multer/s3.service.js";
import S3FoldersPaths from "../../utils/multer/s3_folders_paths.js";
import listUpdateFieldsHandler from "../../utils/handlers/list_update_fields.handler.js";
import { isNumberBetweenOrEqual } from "../../utils/validators/numeric.validator.js";
import StringConstants from "../../utils/constants/strings.constants.js";
import { ApplicationTypeEnum } from "../../utils/constants/enum.constants.js";
class RoadmapService {
    _careerRepository = new CareerRepository(CareerModel);
    _roadmapStepRepository = new RoadmapStepRepository(RoadmapStepModel);
    _quizRespoistory = new QuizRepository(QuizModel);
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
    async _checkQuizzesExists({ quizzesIds, }) {
        if (!quizzesIds?.length) {
            return;
        }
        if ((await this._quizRespoistory.countDocuments({
            filter: {
                _id: {
                    $in: [
                        quizzesIds.map((id) => Types.ObjectId.createFromHexString(id)),
                    ],
                },
            },
        })) !== quizzesIds.length) {
            throw new NotFoundException("some of quizzes are not found ❌");
        }
    }
    createRoadmapStep = async (req, res) => {
        const { careerId, title, order, description, courses, youtubePlaylists, books, quizzesIds, allowGlobalResources, } = req.validationResult.body;
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
        this._checkQuizzesExists({ quizzesIds });
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
                    quizzesIds: quizzesIds,
                    allowGlobalResources,
                },
            ],
        });
        if (!newStep) {
            throw new ServerException("Failed to create roadmap step, please try again ❌");
        }
        await this._careerRepository.updateOne({
            filter: { _id: careerId, __v: career.__v },
            update: { $inc: { stepsCount: 1 } },
        });
        return successHandler({
            res,
            message: "Roadmap step created successfully ✅",
        });
    };
    getRoadmap = ({ archived = false } = {}) => {
        return async (req, res) => {
            const { page, size, searchKey, haveQuizzes, belongToCareers } = req
                .validationResult.query;
            const pipeline = [];
            if (belongToCareers !== StringConstants.ALL) {
                pipeline.push({
                    $match: {
                        careerId: {
                            $in: belongToCareers
                                .split(",")
                                .map((c) => Types.ObjectId.createFromHexString(c)),
                        },
                    },
                });
            }
            if (searchKey || haveQuizzes) {
                const andList = [];
                if (searchKey)
                    andList.push({
                        $or: [
                            { title: { $regex: searchKey, $options: "i" } },
                            {
                                description: { $regex: searchKey, $options: "i" },
                            },
                        ],
                    });
                if (haveQuizzes)
                    andList.push({
                        quizzesIds: {
                            $in: haveQuizzes
                                .split(",")
                                .map((quiz) => Types.ObjectId.createFromHexString(quiz)),
                        },
                    });
                pipeline.push({
                    $match: {
                        $and: andList,
                    },
                });
            }
            pipeline.push({
                $lookup: {
                    from: "careers",
                    localField: "careerId",
                    foreignField: "_id",
                    as: "careerDoc",
                },
            });
            if (!archived) {
                if (!(req.user &&
                    req.tokenPayload?.applicationType === ApplicationTypeEnum.user &&
                    req.user.careerPath?.id?.equals(belongToCareers)))
                    pipeline.push({
                        $match: {
                            $and: [
                                { "careerDoc.freezed": { $exists: false } },
                                { freezed: { $exists: false } },
                            ],
                        },
                    });
            }
            else {
                pipeline.push({
                    $match: {
                        $or: [
                            { "careerDoc.freezed": { $exists: true } },
                            { freezed: { $exists: true } },
                        ],
                    },
                });
            }
            const result = (await this._roadmapStepRepository.aggregate({
                pipeline: [
                    ...pipeline,
                    {
                        $facet: {
                            data: [
                                {
                                    $sort: belongToCareers === StringConstants.ALL
                                        ? { title: 1 }
                                        : { order: 1 },
                                },
                                { $skip: Number((page - 1) * size) },
                                { $limit: size },
                                {
                                    $project: {
                                        careerDoc: 0,
                                        courses: 0,
                                        youtubePlaylists: 0,
                                        books: 0,
                                    },
                                },
                            ],
                            meta: [{ $count: "total" }],
                        },
                    },
                    {
                        $project: {
                            total: { $ifNull: [{ $arrayElemAt: ["$meta.total", 0] }, 0] },
                            data: 1,
                        },
                    },
                ],
            }))[0];
            if (!result.data || result.data.length == 0) {
                throw new NotFoundException(archived
                    ? "No archived roadmap steps found 🔍❌"
                    : "No roadmap steps found 🔍❌");
            }
            return successHandler({
                res,
                body: {
                    totalCount: result.total,
                    totalPages: Math.ceil(result.total / size),
                    currentPage: page,
                    size,
                    data: result.data,
                },
            });
        };
    };
    getRoadmapStep = ({ archived = false } = {}) => {
        return async (req, res) => {
            const { roadmapStepId } = req.params;
            const result = await this._roadmapStepRepository.findOne({
                filter: {
                    _id: roadmapStepId,
                    paranoid: false,
                },
                options: {
                    populate: [
                        {
                            path: "career",
                            match: {
                                paranoid: false,
                            },
                        },
                        {
                            path: "quizzesIds",
                            match: { freezed: { $exists: false } },
                            options: {
                                projection: {
                                    title: 1,
                                    description: 1,
                                    duration: 1,
                                },
                            },
                        },
                    ],
                },
            });
            if (!result) {
                throw new NotFoundException("Invalid roadmapStepId ");
            }
            if (archived) {
                if (!result.freezed &&
                    !result.career.freezed) {
                    throw new NotFoundException("No archived roadmapStep found or career is NOT freezed 🔍❌");
                }
            }
            else {
                if (result.freezed ||
                    result
                        .career.freezed) {
                    throw new NotFoundException("No roadmapStep found or career is freezed 🔍❌");
                }
            }
            return successHandler({ res, body: result });
        };
    };
    updateRoadmapStep = async (req, res) => {
        const { roadmapStepId } = req.params;
        const body = req.validationResult.body;
        const roadmapStep = await this._roadmapStepRepository.findOne({
            filter: { _id: roadmapStepId },
            options: {
                populate: [
                    {
                        path: "careerId",
                        select: "stepsCount",
                    },
                ],
            },
        });
        if (!roadmapStep || !roadmapStep.careerId) {
            throw new NotFoundException("Invalid roadmapStepId, roadmapStep is freezed or its career is freezed ❌");
        }
        if (!isNumberBetweenOrEqual({
            value: RoadmapService.getTotalResourceCount({
                currentResources: roadmapStep.courses,
                removeResources: body.removeCourses,
                newResourcesCount: body.courses?.length ?? 0,
            }),
            min: 1,
            max: 5,
        }) ||
            !isNumberBetweenOrEqual({
                value: RoadmapService.getTotalResourceCount({
                    currentResources: roadmapStep.youtubePlaylists,
                    removeResources: body.removeYoutubePlaylists,
                    newResourcesCount: body.youtubePlaylists?.length ?? 0,
                }),
                min: 1,
                max: 5,
            }) ||
            RoadmapService.getTotalResourceCount({
                currentResources: roadmapStep.books,
                removeResources: body.removeBooks,
                newResourcesCount: body.books?.length ?? 0,
            }) > 5 ||
            !isNumberBetweenOrEqual({
                value: RoadmapService.getTotalResourceCount({
                    currentResources: roadmapStep.quizzesIds,
                    removeResources: body.removeQuizzesIds,
                    newResourcesCount: body.quizzesIds?.length ?? 0,
                }),
                min: 1,
                max: 5,
            })) {
            throw new BadRequestException("Each roadmap step list (courses | youtubePlaylists | books | quizzes) must be at most 5 items length, and only (courses | youtubePlaylists | quizzes) must be at least 1 item length ❌");
        }
        this._checkQuizzesExists({ quizzesIds: body.quizzesIds });
        const session = await startSession();
        await session.withTransaction(async () => {
            if (body.order && body.order != roadmapStep.order) {
                await this._roadmapStepRepository.updateMany({
                    filter: {
                        careerId: roadmapStep.careerId._id,
                        order: {
                            $gte: Math.min(body.order, roadmapStep.order),
                            $lte: Math.max(body.order, roadmapStep.order),
                        },
                    },
                    update: { $inc: { order: 700 } },
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
            if (body.allowGlobalResources != undefined)
                toUpdate.allowGlobalResources = body.allowGlobalResources;
            await this._roadmapStepRepository.updateOne({
                filter: { _id: roadmapStepId, __v: body.v },
                update: [
                    {
                        $set: {
                            ...toUpdate,
                            ...{
                                quizzesIds: {
                                    $setUnion: [
                                        {
                                            $setDifference: [
                                                "$quizzesIds",
                                                body.removeQuizzesIds?.map((quiz) => Types.ObjectId.createFromHexString(quiz)) ?? [],
                                            ],
                                        },
                                        body.quizzesIds?.map((quiz) => Types.ObjectId.createFromHexString(quiz)) ?? [],
                                    ],
                                },
                            },
                        },
                    },
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
                await this._roadmapStepRepository.updateMany({
                    filter: {
                        careerId: roadmapStep.careerId._id,
                        order: { $gte: Math.min(body.order, roadmapStep.order) + 700 },
                    },
                    update: {
                        $inc: {
                            order: body.order < roadmapStep.order ? -699 : -701,
                        },
                    },
                    options: { session },
                });
            }
        });
        return successHandler({ res });
    };
    static getTotalResourceCount({ currentResources, removeResources, newResourcesCount, }) {
        if (!currentResources?.length) {
            return newResourcesCount;
        }
        else if (!removeResources || !removeResources.length) {
            return currentResources.length + newResourcesCount;
        }
        let totalResources = currentResources.length + newResourcesCount;
        for (const removeResource of removeResources) {
            if (currentResources.findIndex((c) => {
                return Types.ObjectId.isValid(c.toString())
                    ? c.equals(removeResource)
                    : c._id.equals(removeResource);
            }) !== -1) {
                totalResources--;
            }
        }
        return totalResources;
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
    updateRoadmapStepResource = async (req, res) => {
        const { roadmapStepId, resourceId, resourceName } = req.params;
        const body = req.body;
        const roadmapStep = await this._roadmapStepRepository.findOne({
            filter: {
                _id: roadmapStepId,
                [`${resourceName}`]: {
                    $elemMatch: { _id: Types.ObjectId.createFromHexString(resourceId) },
                },
            },
            projection: {
                careerId: 1,
                [`${resourceName}`]: {
                    $elemMatch: { _id: Types.ObjectId.createFromHexString(resourceId) },
                },
            },
            options: {
                populate: [{ path: "careerId", select: "assetFolderId" }],
            },
        });
        if (!roadmapStep || !roadmapStep.careerId) {
            throw new NotFoundException("Invalid roadmapStepId, its career freezed or invalid resourceId ❌");
        }
        if (body.url || body.title) {
            const exist = await this._roadmapStepRepository.findOne({
                filter: {
                    _id: roadmapStepId,
                    [`${resourceName}`]: {
                        $elemMatch: { $or: [{ title: body.title }, { url: body.url }] },
                    },
                },
                projection: {
                    _id: 0,
                    [`${resourceName}`]: {
                        $elemMatch: { $or: [{ title: body.title }, { url: body.url }] },
                    },
                },
            });
            if (exist) {
                throw new BadRequestException(`This title or url already exists in the ${resourceName} list ❌`);
            }
        }
        let subKey;
        if (body.attachment) {
            subKey = (await Promise.all([
                roadmapStep[resourceName][0]?.pictureUrl
                    ? S3Service.deleteFile({
                        SubKey: roadmapStep[resourceName][0]?.pictureUrl,
                    })
                    : undefined,
                S3Service.uploadFile({
                    File: body.attachment,
                    Path: S3FoldersPaths.roadmapStepResourceFolderPath(roadmapStep.careerId.assetFolderId, resourceName, roadmapStepId),
                }),
            ]))[1];
        }
        const result = await this._roadmapStepRepository.findOneAndUpdate({
            filter: {
                _id: roadmapStepId,
                [`${resourceName}`]: {
                    $elemMatch: { _id: resourceId },
                },
                __v: body.v,
            },
            update: listUpdateFieldsHandler({
                resourceName,
                body,
                attachmentSubKey: subKey,
            }),
            options: {
                new: true,
                arrayFilters: [
                    { "el._id": Types.ObjectId.createFromHexString(resourceId) },
                ],
                projection: {
                    _id: 0,
                    __v: 1,
                    [`${resourceName}`]: {
                        $elemMatch: { _id: Types.ObjectId.createFromHexString(resourceId) },
                    },
                },
            },
        });
        if (!result) {
            throw new NotFoundException("Invalid resourceId ❌");
        }
        return successHandler({
            res,
            body: {
                [`${resourceName}`]: result.toJSON()[resourceName],
                v: result.__v,
            },
        });
    };
}
export default RoadmapService;
