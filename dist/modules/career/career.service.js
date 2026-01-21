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
import { RoadmapService } from "../roadmap/index.js";
import listUpdateFieldsHandler from "../../utils/handlers/list_update_fields.handler.js";
class CareerService {
    _careerRepository = new CareerRepository(CareerModel);
    _roadmapStepRepository = new RoadmapStepRepository(RoadmapStepModel);
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
            ...this._getResourceSpecifiedStepsIds(body.courses).values(),
            ...this._getResourceSpecifiedStepsIds(body.youtubePlaylists).values(),
            ...this._getResourceSpecifiedStepsIds(body.books).values(),
        ]);
        if (specifiedStepsIdsSet.size > 0) {
            const existingStepsCount = await this._roadmapStepRepository.countDocuments({
                filter: { _id: { $in: Array.from(specifiedStepsIdsSet) }, careerId },
            });
            if (existingStepsCount !== specifiedStepsIdsSet.size) {
                throw new NotFoundException(`One or more specifiedSteps do not exist ❌`);
            }
        }
        if (RoadmapService.getTotalResourceCount({
            currentResources: career.courses,
            removeResources: body.removeCourses,
            newResourcesCount: body.courses?.length ?? 0,
        }) > 5 ||
            RoadmapService.getTotalResourceCount({
                currentResources: career.youtubePlaylists,
                removeResources: body.removeYoutubePlaylists,
                newResourcesCount: body.youtubePlaylists?.length ?? 0,
            }) > 5 ||
            RoadmapService.getTotalResourceCount({
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
                ...RoadmapService.buildUniqueAppendStages({
                    fieldName: "courses",
                    newItems: body.courses?.map((rs) => {
                        return {
                            ...rs,
                            specifiedSteps: rs.specifiedSteps?.map((id) => Types.ObjectId.createFromHexString(id)) ?? [],
                        };
                    }),
                    removeIds: body.removeCourses?.map((id) => Types.ObjectId.createFromHexString(id)),
                }),
                ...RoadmapService.buildUniqueAppendStages({
                    fieldName: "youtubePlaylists",
                    newItems: body.youtubePlaylists?.map((rs) => {
                        return {
                            ...rs,
                            specifiedSteps: rs.specifiedSteps?.map((id) => Types.ObjectId.createFromHexString(id)) ?? [],
                        };
                    }),
                    removeIds: body.removeYoutubePlaylists?.map((id) => Types.ObjectId.createFromHexString(id)),
                }),
                ...RoadmapService.buildUniqueAppendStages({
                    fieldName: "books",
                    newItems: body.books?.map((rs) => {
                        return {
                            ...rs,
                            specifiedSteps: rs.specifiedSteps?.map((id) => Types.ObjectId.createFromHexString(id)) ?? [],
                        };
                    }),
                    removeIds: body.removeBooks?.map((id) => Types.ObjectId.createFromHexString(id)),
                }),
            ],
        });
        return successHandler({ res });
    };
    _getResourceSpecifiedStepsIds = (resources) => {
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
    updateCareerResource = async (req, res) => {
        const { careerId, resourceName, resourceId } = req.params;
        const body = req.validationResult.body;
        const career = await this._careerRepository.findOne({
            filter: {
                _id: careerId,
                [`${resourceName}`]: {
                    $elemMatch: { _id: Types.ObjectId.createFromHexString(resourceId) },
                },
            },
            projection: {
                assetFolderId: 1,
                [`${resourceName}`]: {
                    $elemMatch: { _id: Types.ObjectId.createFromHexString(resourceId) },
                },
            },
        });
        if (!career) {
            throw new NotFoundException("Invalid careerId, career freezed or invalid resourceId ❌");
        }
        if (career[resourceName][0]?.appliesTo ===
            CareerResourceAppliesToEnum.specific &&
            body.appliesTo === CareerResourceAppliesToEnum.all) {
            body.specifiedSteps = [];
        }
        if (body.url || body.title) {
            const exist = await this._careerRepository.findOne({
                filter: {
                    _id: careerId,
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
        if (body.specifiedSteps) {
            if (body.appliesTo !== CareerResourceAppliesToEnum.specific &&
                career[resourceName][0]?.appliesTo == CareerResourceAppliesToEnum.all) {
                throw new BadRequestException("specifiedSteps can't have values when appliesTo equals All ❌");
            }
            const specifiedStepsIdsSet = new Set(body.specifiedSteps);
            const existingStepsCount = await this._roadmapStepRepository.countDocuments({
                filter: { _id: { $in: Array.from(specifiedStepsIdsSet) }, careerId },
            });
            if (existingStepsCount !== specifiedStepsIdsSet.size) {
                throw new NotFoundException(`One or more specifiedSteps do not exist for this career ❌`);
            }
        }
        let subKey;
        if (body.attachment) {
            subKey = (await Promise.all([
                career[resourceName][0]?.pictureUrl
                    ? S3Service.deleteFile({
                        SubKey: career[resourceName][0]?.pictureUrl,
                    })
                    : undefined,
                S3Service.uploadFile({
                    File: body.attachment,
                    Path: S3FoldersPaths.careerResourceFolderPath(career.assetFolderId, resourceName),
                }),
            ]))[1];
        }
        const result = await this._careerRepository.findOneAndUpdate({
            filter: {
                _id: careerId,
                [`${resourceName}`]: {
                    $elemMatch: { _id: resourceId },
                },
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
                    [`${resourceName}`]: {
                        $elemMatch: { _id: Types.ObjectId.createFromHexString(resourceId) },
                    },
                },
            },
        });
        if (!result) {
            throw new NotFoundException("Invalid resourceId ❌");
        }
        return successHandler({ res, body: result });
    };
}
export default CareerService;
