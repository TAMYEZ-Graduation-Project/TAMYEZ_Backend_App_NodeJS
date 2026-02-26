import { BadRequestException, ContentTooLargeException, VersionConflictException, } from "../../utils/exceptions/custom.exceptions.js";
import StringConstants from "../../utils/constants/strings.constants.js";
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    create = async ({ data, options = {
        validateBeforeSave: true,
    }, }) => {
        const resultList = await this.model.create(data, options);
        if (!resultList || resultList.length == 0) {
            throw new BadRequestException(StringConstants.FAILED_CREATE_INSTANCE_MESSAGE);
        }
        return resultList;
    };
    find = async ({ filter = {}, projection, options = {}, } = {}) => {
        return this.model.find(filter, projection, options);
    };
    paginate = async ({ filter, projection, options = {}, page = "All", size, maxAllCount, }) => {
        let docsCount;
        let totalPages;
        if (page !== "All") {
            page = Math.floor(!page || page < 1 ? 1 : page);
            options.limit = Math.floor(!size || size < 1 ? 5 : size);
            options.skip = (page - 1) * size;
            docsCount = await this.model.countDocuments(filter);
            if (maxAllCount && docsCount > maxAllCount) {
                throw new ContentTooLargeException(`All docs count exceeded the maximum limit ${maxAllCount}`);
            }
            totalPages = Math.ceil(docsCount / size);
        }
        const data = await this.model.find(filter, projection, options);
        return {
            totalCount: docsCount,
            totalPages,
            currentPage: page !== "All" ? page : undefined,
            size: page !== "All" ? size : undefined,
            data: data,
        };
    };
    findOne = async ({ filter, projection, options = {}, }) => {
        const res = await this.model.findOne(filter, projection, options);
        if (filter?.__v != undefined && res == undefined) {
            const { __v, ...baseFilter } = filter;
            const existsIgnoringVersion = await this.model.exists(baseFilter);
            if (existsIgnoringVersion) {
                throw new VersionConflictException(StringConstants.INVALID_VERSION_MESSAGE);
            }
        }
        return res;
    };
    findById = async ({ id, projection, options = {}, }) => {
        return this.model.findById(id, projection, options);
    };
    updateMany = async ({ filter = {}, update, options = {}, }) => {
        if (Array.isArray(update)) {
            update.push({
                $set: {
                    __v: { $add: ["$__v", 1] },
                },
            });
        }
        else {
            update = {
                ...update,
                $inc: Object.assign(update["$inc"] ?? {}, {
                    __v: 1,
                }),
            };
        }
        return this.model.updateMany(filter, update, options);
    };
    bulkWrite = async ({ operations = [], options = { ordered: false }, }) => {
        return this.model.bulkWrite(operations, options);
    };
    updateOne = async ({ filter = {}, update, options = {}, }) => {
        if (Array.isArray(update)) {
            update.push({
                $set: {
                    __v: { $add: ["$__v", 1] },
                },
            });
        }
        else {
            update = {
                ...update,
                $inc: Object.assign(update["$inc"] ?? {}, {
                    __v: 1,
                }),
            };
        }
        const res = await this.model.updateOne(filter, update, options);
        if (filter?.__v != undefined) {
            if (!res.matchedCount) {
                const { __v, ...baseFilter } = filter;
                const existsIgnoringVersion = await this.model.exists(baseFilter);
                if (existsIgnoringVersion) {
                    throw new VersionConflictException(StringConstants.INVALID_VERSION_MESSAGE);
                }
            }
        }
        return res;
    };
    updateById = async ({ id, v, update, options = {}, }) => {
        if (Array.isArray(update)) {
            update.push({
                $set: {
                    __v: { $add: ["$__v", 1] },
                },
            });
        }
        else {
            update = {
                ...update,
                $inc: Object.assign(update["$inc"] ?? {}, {
                    __v: 1,
                }),
            };
        }
        const res = await this.model.updateOne({ _id: id, ...(v != undefined ? { __v: v } : undefined) }, update, options);
        if (!res.matchedCount) {
            const existsIgnoringVersion = await this.model.exists({ _id: id });
            if (existsIgnoringVersion) {
                throw new VersionConflictException(StringConstants.INVALID_VERSION_MESSAGE);
            }
        }
        return res;
    };
    findOneAndUpdate = async ({ filter = {}, update, options = { new: true }, }) => {
        if (Array.isArray(update)) {
            update.push({
                $set: {
                    __v: { $add: ["$__v", 1] },
                },
            });
        }
        else {
            update = {
                ...update,
                $inc: Object.assign(update["$inc"] ?? {}, {
                    __v: 1,
                }),
            };
        }
        const res = await this.model.findOneAndUpdate(filter, update, options);
        if (!res) {
            const { __v, ...baseFilter } = filter;
            const existsIgnoringVersion = await this.model.exists(baseFilter);
            if (existsIgnoringVersion) {
                throw new VersionConflictException(StringConstants.INVALID_VERSION_MESSAGE);
            }
        }
        return res;
    };
    findByIdAndUpdate = async ({ id, v, update, options = { new: true }, }) => {
        if (Array.isArray(update)) {
            update.push({
                $set: {
                    __v: { $add: ["$__v", 1] },
                },
            });
        }
        else {
            update = {
                ...update,
                $inc: Object.assign(update["$inc"] ?? {}, {
                    __v: 1,
                }),
            };
        }
        const res = await this.model.findOneAndUpdate({ _id: id, ...(v != undefined ? { __v: v } : undefined) }, {
            ...update,
            $inc: Object.assign(update["$inc"] ?? {}, {
                __v: 1,
            }),
        }, options);
        if (!res) {
            const existsIgnoringVersion = await this.model.exists({ _id: id });
            if (existsIgnoringVersion) {
                throw new VersionConflictException(StringConstants.INVALID_VERSION_MESSAGE);
            }
        }
        return res;
    };
    deleteOne = async ({ filter = {}, options = {}, }) => {
        const res = await this.model.deleteOne(filter, options);
        if (!res.deletedCount) {
            const { __v, ...baseFilter } = filter;
            const existsIgnoringVersion = await this.model.exists(baseFilter);
            if (existsIgnoringVersion) {
                throw new VersionConflictException(StringConstants.INVALID_VERSION_MESSAGE);
            }
        }
        return res;
    };
    deleteMany = async ({ filter = {}, options = {}, }) => {
        return this.model.deleteMany(filter, options);
    };
    findOneAndDelete = async ({ filter = {}, options = { new: true }, }) => {
        const res = await this.model.findOneAndDelete(filter, options);
        if (filter?.__v != undefined && res == undefined) {
            const { __v, ...baseFilter } = filter;
            const existsIgnoringVersion = await this.model.exists(baseFilter);
            if (existsIgnoringVersion) {
                throw new VersionConflictException(StringConstants.INVALID_VERSION_MESSAGE);
            }
        }
        return res;
    };
    replaceOne = async ({ filter = {}, replacement, options = {}, }) => {
        const res = await this.model.replaceOne(filter, replacement, options);
        if (!res.matchedCount && filter?.__v != undefined) {
            const { __v, ...baseFilter } = filter;
            const existsIgnoringVersion = await this.model.exists(baseFilter);
            if (existsIgnoringVersion) {
                throw new VersionConflictException(StringConstants.INVALID_VERSION_MESSAGE);
            }
        }
        return res;
    };
    countDocuments = async ({ filter = {}, }) => {
        return this.model.countDocuments(filter);
    };
    exists = async ({ filter, }) => {
        return this.model.exists(filter);
    };
    aggregate = async ({ pipeline, options, }) => {
        return this.model.aggregate(pipeline, options);
    };
}
export default DatabaseRepository;
