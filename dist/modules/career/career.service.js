import { CareerModel, RoadmapStepModel } from "../../db/models/index.js";
import { CareerRepository, RoadmapStepRepository, } from "../../db/repositories/index.js";
import successHandler from "../../utils/handlers/success.handler.js";
import { BadRequestException, ConflictException, NotFoundException, ServerException, } from "../../utils/exceptions/custom.exceptions.js";
import EnvFields from "../../utils/constants/env_fields.constants.js";
import S3Service from "../../utils/multer/s3.service.js";
import IdSecurityUtil from "../../utils/security/id.security.js";
import S3FoldersPaths from "../../utils/multer/s3_folders_paths.js";
import S3KeyUtil from "../../utils/multer/s3_key.multer.js";
import { CareerResourceAppliesToEnum } from "../../utils/constants/enum.constants.js";
import { Types } from "mongoose";
class CareerService {
    _careerRepository = new CareerRepository(CareerModel);
    _roadmapStepRepository = new RoadmapStepRepository(RoadmapStepModel);
    getResourceSpecifiedStepsIds = (resources) => {
        const specifiedStepsIdsSet = new Set();
        if (resources?.length) {
            for (const resource of resources) {
                if (resource.appliesTo === CareerResourceAppliesToEnum.specific &&
                    resource.specifiedSteps?.length) {
                    resource.specifiedSteps.forEach((stepId) => specifiedStepsIdsSet.add(stepId.toString()));
                }
            }
        }
        return specifiedStepsIdsSet;
    };
    createCareer = async (req, res) => {
        const { title, description, courses, youtubePlaylists, books } = req
            .validationResult.body;
        const careerExists = await this._careerRepository.findOne({
            filter: { title, paranoid: false },
        });
        if (careerExists) {
            throw new ConflictException(`Career title conflicts with another ${careerExists.freezed?.at ? "archived " : ""}career ❌`);
        }
        const [newCareer] = await this._careerRepository.create({
            data: [
                {
                    title,
                    description,
                    assetFolderId: IdSecurityUtil.generateAlphaNumericId(),
                    pictureUrl: process.env[EnvFields.CAREER_DEFAULT_PICTURE_URL],
                    courses: courses,
                    youtubePlaylists: youtubePlaylists,
                    books: books,
                },
            ],
        });
        if (!newCareer) {
            throw new ServerException(`Failed to create career, please try again later ☹️`);
        }
        return successHandler({ res, message: "Career created successfully ✅" });
    };
    uploadCareerPicture = async (req, res) => {
        const { careerId } = req.params;
        const { attachment } = req.body;
        const career = await this._careerRepository.findOne({
            filter: { _id: careerId },
        });
        if (!career) {
            throw new NotFoundException("Invalid careerId or career freezed ❌");
        }
        const [_, subKey] = await Promise.all([
            career.pictureUrl &&
                career.pictureUrl != process.env[EnvFields.CAREER_DEFAULT_PICTURE_URL]
                ? S3Service.deleteFile({ SubKey: career.pictureUrl })
                : undefined,
            S3Service.uploadFile({
                File: attachment,
                Path: S3FoldersPaths.careerFolderPath(career.assetFolderId),
            }),
        ]);
        await career.updateOne({ pictureUrl: subKey });
        return successHandler({
            res,
            body: {
                pictureUrl: S3KeyUtil.generateS3UploadsUrlFromSubKey(subKey),
            },
        });
    };
    updateCareer = async (req, res) => {
        const { careerId } = req.params;
        const body = req.validationResult.body;
        const career = await this._careerRepository.findOne({
            filter: { _id: careerId },
        });
        if (!career) {
            throw new NotFoundException("Invalid careerId or career freezed ❌");
        }
        const specifiedStepsIdsSet = new Set([
            ...this.getResourceSpecifiedStepsIds(body.courses).values(),
            ...this.getResourceSpecifiedStepsIds(body.youtubePlaylists).values(),
            ...this.getResourceSpecifiedStepsIds(body.books).values(),
        ]);
        if (specifiedStepsIdsSet.size > 0) {
            const existingStepsCount = await this._roadmapStepRepository.countDocuments({
                filter: { _id: { $in: Array.from(specifiedStepsIdsSet) } },
            });
            if (existingStepsCount !== specifiedStepsIdsSet.size) {
                throw new NotFoundException(`One or more specifiedSteps do not exist ❌`);
            }
        }
        if (this._getTotalResourceCount({
            currentResources: career.courses,
            removeResources: body.removeCourses,
            newResourcesCount: body.courses?.length ?? 0,
        }) > 5 ||
            this._getTotalResourceCount({
                currentResources: career.youtubePlaylists,
                removeResources: body.removeYoutubePlaylists,
                newResourcesCount: body.youtubePlaylists?.length ?? 0,
            }) > 5 ||
            this._getTotalResourceCount({
                currentResources: career.books,
                removeResources: body.removeBooks,
                newResourcesCount: body.books?.length ?? 0,
            }) > 5) {
            throw new BadRequestException("Each career resource list (courses | youtubePlaylists | books) must be at most 5 items length ❌");
        }
        const toUpdate = {};
        if (body.title)
            toUpdate.title = body.title;
        if (body.description)
            toUpdate.description = body.description;
        await this._careerRepository.updateOne({
            filter: { _id: careerId },
            update: [
                { $set: { ...toUpdate } },
                ...(body.courses
                    ? CareerService.buildUniqueAppendStages({
                        fieldName: "courses",
                        newItems: body.courses?.map((rs) => {
                            return {
                                ...rs,
                                specifiedSteps: rs.specifiedSteps?.map((id) => Types.ObjectId.createFromHexString(id)) ?? [],
                            };
                        }),
                        removeIds: body.removeCourses?.map((id) => Types.ObjectId.createFromHexString(id)),
                    })
                    : []),
                ...(body.youtubePlaylists
                    ? CareerService.buildUniqueAppendStages({
                        fieldName: "youtubePlaylists",
                        newItems: body.youtubePlaylists?.map((rs) => {
                            return {
                                ...rs,
                                specifiedSteps: rs.specifiedSteps?.map((id) => Types.ObjectId.createFromHexString(id)) ?? [],
                            };
                        }),
                        removeIds: body.removeYoutubePlaylists?.map((id) => Types.ObjectId.createFromHexString(id)),
                    })
                    : []),
                ...(body.books
                    ? CareerService.buildUniqueAppendStages({
                        fieldName: "books",
                        newItems: body.books?.map((rs) => {
                            return {
                                ...rs,
                                specifiedSteps: rs.specifiedSteps?.map((id) => Types.ObjectId.createFromHexString(id)) ?? [],
                            };
                        }),
                        removeIds: body.removeBooks?.map((id) => Types.ObjectId.createFromHexString(id)),
                    })
                    : []),
            ],
        });
        return successHandler({ res });
    };
    _getTotalResourceCount({ currentResources, removeResources, newResourcesCount, }) {
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
    static buildUniqueAppendStages({ fieldName, removeIds = [], newItems, }) {
        const tmpTitles = `_${fieldName}_titles`;
        const tmpUrls = `_${fieldName}_urls`;
        const tmpToAdd = `_${fieldName}_toAdd`;
        return [
            {
                $set: {
                    [fieldName]: {
                        $filter: {
                            input: `$${fieldName}`,
                            as: "it",
                            cond: { $not: { $in: ["$$it._id", removeIds] } },
                        },
                    },
                },
            },
            {
                $set: {
                    [tmpTitles]: {
                        $filter: {
                            input: {
                                $map: { input: `$${fieldName}`, as: "it", in: "$$it.title" },
                            },
                            as: "t",
                            cond: { $and: [{ $ne: ["$$t", null] }, { $ne: ["$$t", ""] }] },
                        },
                    },
                    [tmpUrls]: {
                        $filter: {
                            input: {
                                $map: { input: `$${fieldName}`, as: "it", in: "$$it.url" },
                            },
                            as: "u",
                            cond: { $and: [{ $ne: ["$$u", null] }, { $ne: ["$$u", ""] }] },
                        },
                    },
                },
            },
            {
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
            },
            {
                $set: {
                    [tmpToAdd]: {
                        $map: {
                            input: `$${tmpToAdd}`,
                            as: "x",
                            in: {
                                $mergeObjects: [
                                    {
                                        _id: {
                                            $ifNull: [
                                                "$$x._id",
                                                {
                                                    $function: {
                                                        body: "return new ObjectId();",
                                                        args: [],
                                                        lang: "js",
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                    "$$x",
                                ],
                            },
                        },
                    },
                },
            },
            {
                $set: {
                    [fieldName]: {
                        $concatArrays: [`$${fieldName}`, `$${tmpToAdd}`],
                    },
                },
            },
            { $unset: [tmpTitles, tmpUrls, tmpToAdd] },
        ];
    }
}
export default CareerService;
