import type {
  AnyBulkWriteOperation,
  DeleteResult,
  MongooseBaseQueryOptions,
  MongooseBulkWriteResult,
  PipelineStage,
  UpdateWriteOpResult,
} from "mongoose";
import type {
  HydratedDocument,
  MongooseUpdateQueryOptions,
  ProjectionType,
  RootFilterQuery,
  Types,
  UpdateQuery,
} from "mongoose";
import type { CreateOptions, Model } from "mongoose";
import {
  BadRequestException,
  ContentTooLargeException,
  VersionConflictException,
} from "../../utils/exceptions/custom.exceptions.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";
import type {
  FindFunctionOptionsType,
  FindFunctionsReturnType,
  FindOneFunctionsReturnType,
  LeanType,
} from "../../utils/types/find_functions.type.ts";
import type { IPaginationResult } from "../../utils/constants/interface.constants.ts";
import type {
  UpdateFunctionsUpdateObjectType,
  UpdateType,
} from "../../utils/types/update_functions.type.ts";
import type { PartialUndefined } from "../../utils/types/partial_undefined.type.ts";
import type { UpdateOptions } from "mongodb";
import type { MongooseBulkWriteOptions } from "mongoose";
import type { InferId } from "mongoose";
import type { AggregateOptions } from "mongoose";
import type { Aggregate } from "mongoose";

abstract class DatabaseRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  create = async ({
    data,
    options = {
      validateBeforeSave: true,
    },
  }: {
    data: PartialUndefined<TDocument>[];
    options?: CreateOptions;
  }): Promise<HydratedDocument<TDocument>[]> => {
    const resultList = await this.model.create(data, options);
    if (!resultList || resultList.length == 0) {
      throw new BadRequestException(
        StringConstants.FAILED_CREATE_INSTANCE_MESSAGE,
      );
    }

    return resultList;
  };

  find = async <TLean extends boolean = false>({
    filter = {},
    projection,
    options = {},
  }: {
    filter?: RootFilterQuery<TDocument>;
    projection?: ProjectionType<TDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  } = {}): Promise<FindFunctionsReturnType<TDocument, TLean>> => {
    return this.model.find(filter, projection, options);
  };

  paginate = async <TLean extends boolean = false>({
    filter,
    projection,
    options = {},
    page = "All",
    size,
    maxAllCount,
  }: {
    filter: RootFilterQuery<TDocument>;
    projection?: ProjectionType<TDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
    page: number | "All";
    size: number;
    maxAllCount?: number | undefined;
  }): Promise<IPaginationResult<TDocument, TLean>> => {
    let docsCount;
    let totalPages;
    if (page !== "All") {
      page = Math.floor(!page || page < 1 ? 1 : page);
      options.limit = Math.floor(!size || size < 1 ? 5 : size);
      options.skip = (page - 1) * size;

      docsCount = await this.model.countDocuments(filter);
      if (maxAllCount && docsCount > maxAllCount) {
        throw new ContentTooLargeException(
          `All docs count exceeded the maximum limit ${maxAllCount}`,
        );
      }
      totalPages = Math.ceil(docsCount / size);
    }
    const data = await this.model.find(filter, projection, options);

    return {
      totalCount: docsCount,
      totalPages,
      currentPage: page !== "All" ? page : undefined,
      size: page !== "All" ? size : undefined,
      data: data as unknown as FindFunctionsReturnType<TDocument, TLean>,
    };
  };

  findOne = async <TLean extends boolean = false>({
    filter,
    projection,
    options = {},
  }: {
    filter?: RootFilterQuery<TDocument> & { __v?: number | undefined };
    projection?: ProjectionType<TDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  }): Promise<FindOneFunctionsReturnType<TDocument, TLean>> => {
    const res = await this.model.findOne(filter, projection, options);
    if (filter?.__v && !res) {
      const { __v, ...baseFilter } = filter;
      const existsIgnoringVersion = await this.model.exists(baseFilter);
      if (existsIgnoringVersion) {
        throw new VersionConflictException(
          StringConstants.INVALID_VERSION_MESSAGE,
        );
      }
    }
    return res as FindOneFunctionsReturnType<TDocument, TLean>;
  };

  findById = async <TLean extends boolean = false>({
    id,
    projection,
    options = {},
  }: {
    id: Types.ObjectId | string;
    projection?: ProjectionType<TDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  }): Promise<FindOneFunctionsReturnType<TDocument, TLean>> => {
    return this.model.findById(id, projection, options);
  };

  updateMany = async <TUpdate extends UpdateType = Record<string, any>>({
    filter = {},
    update,
    options = {},
  }: {
    filter?: RootFilterQuery<TDocument>;
    update: UpdateFunctionsUpdateObjectType<TDocument, TUpdate>;
    options?: UpdateOptions & MongooseUpdateQueryOptions<TDocument>;
  }): Promise<UpdateWriteOpResult> => {
    if (Array.isArray(update)) {
      update.push({
        $set: {
          __v: { $add: ["$__v", 1] },
        },
      });
    } else {
      update = {
        ...update,
        $inc: Object.assign((update as Record<string, any>)["$inc"] ?? {}, {
          __v: 1,
        }),
      };
    }
    return this.model.updateMany(filter, update, options);
  };

  bulkWrite = async ({
    operations = [],
    options = { ordered: false },
  }: {
    operations?: Array<AnyBulkWriteOperation<TDocument>>;
    options?: MongooseBulkWriteOptions;
  }): Promise<MongooseBulkWriteResult> => {
    return this.model.bulkWrite(operations, options);
  };

  updateOne = async <TUpdate extends UpdateType = Record<string, any>>({
    filter = { __v: 0 },
    update,
    options = {},
  }: {
    filter?: RootFilterQuery<TDocument> & { __v: number | undefined };
    update: UpdateFunctionsUpdateObjectType<TDocument, TUpdate>;
    options?: UpdateOptions & MongooseUpdateQueryOptions<TDocument>;
  }): Promise<UpdateWriteOpResult> => {
    if (Array.isArray(update)) {
      update.push({
        $set: {
          __v: { $add: ["$__v", 1] },
        },
      });
    } else {
      update = {
        ...update,
        $inc: Object.assign((update as Record<string, any>)["$inc"] ?? {}, {
          __v: 1,
        }),
      };
    }
    const res = await this.model.updateOne(filter, update, options);

    if (!res.matchedCount) {
      const { __v, ...baseFilter } = filter;
      const existsIgnoringVersion = await this.model.exists(baseFilter);
      if (existsIgnoringVersion) {
        throw new VersionConflictException(
          StringConstants.INVALID_VERSION_MESSAGE,
        );
      }
    }

    return res;
  };

  updateById = async <TUpdate extends UpdateType>({
    id,
    v,
    update,
    options = {},
  }: {
    id: Types.ObjectId | string;
    v: number;
    update: UpdateFunctionsUpdateObjectType<TDocument, TUpdate>;
    options?: MongooseUpdateQueryOptions<TDocument>;
  }): Promise<UpdateWriteOpResult> => {
    if (Array.isArray(update)) {
      update.push({
        $set: {
          __v: { $add: ["$__v", 1] },
        },
      });
    } else {
      update = {
        ...update,
        $inc: Object.assign((update as Record<string, any>)["$inc"] ?? {}, {
          __v: 1,
        }),
      };
    }
    const res = await this.model.updateOne(
      { _id: id, __v: v },
      update,
      options,
    );

    if (!res.matchedCount) {
      const existsIgnoringVersion = await this.model.exists({ _id: id });
      if (existsIgnoringVersion) {
        throw new VersionConflictException(
          StringConstants.INVALID_VERSION_MESSAGE,
        );
      }
    }
    return res;
  };

  findOneAndUpdate = async <
    TUpdate extends UpdateType = Record<string, any>,
    TLean extends boolean = false,
  >({
    filter = { __v: 0 },
    update,
    options = { new: true },
  }: {
    filter?: RootFilterQuery<TDocument> & { __v: number | undefined };
    update: UpdateFunctionsUpdateObjectType<TDocument, TUpdate>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  }): Promise<FindOneFunctionsReturnType<TDocument, TLean>> => {
    if (Array.isArray(update)) {
      update.push({
        $set: {
          __v: { $add: ["$__v", 1] },
        },
      });
    } else {
      update = {
        ...update,
        $inc: Object.assign((update as Record<string, any>)["$inc"] ?? {}, {
          __v: 1,
        }),
      };
    }
    const res = await this.model.findOneAndUpdate(filter, update, options);

    if (!res) {
      const { __v, ...baseFilter } = filter;
      const existsIgnoringVersion = await this.model.exists(baseFilter);
      if (existsIgnoringVersion) {
        throw new VersionConflictException(
          StringConstants.INVALID_VERSION_MESSAGE,
        );
      }
    }

    return res as FindOneFunctionsReturnType<TDocument, TLean>;
  };

  findByIdAndUpdate = async <TLean extends LeanType = false>({
    id,
    v,
    update,
    options = { new: true },
  }: {
    id: Types.ObjectId | string;
    v: number;
    update: UpdateQuery<TDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  }): Promise<FindOneFunctionsReturnType<TDocument, TLean>> => {
    if (Array.isArray(update)) {
      update.push({
        $set: {
          __v: { $add: ["$__v", 1] },
        },
      });
    } else {
      update = {
        ...update,
        $inc: Object.assign((update as Record<string, any>)["$inc"] ?? {}, {
          __v: 1,
        }),
      };
    }

    const res = await this.model.findOneAndUpdate(
      { _id: id, __v: v },
      {
        ...update,
        $inc: Object.assign((update as Record<string, any>)["$inc"] ?? {}, {
          __v: 1,
        }),
      },
      options,
    );

    if (!res) {
      const existsIgnoringVersion = await this.model.exists({ _id: id });
      if (existsIgnoringVersion) {
        throw new VersionConflictException(
          StringConstants.INVALID_VERSION_MESSAGE,
        );
      }
    }

    return res as FindOneFunctionsReturnType<TDocument, TLean>;
  };

  deleteOne = async ({
    filter = { __v: undefined },
    options = {},
  }: {
    filter?: RootFilterQuery<TDocument> & { __v: number | undefined };
    options?: MongooseBaseQueryOptions<TDocument>;
  }): Promise<DeleteResult> => {
    const res = await this.model.deleteOne(filter, options);

    if (!res.deletedCount) {
      const { __v, ...baseFilter } = filter;
      const existsIgnoringVersion = await this.model.exists(baseFilter);
      if (existsIgnoringVersion) {
        throw new VersionConflictException(
          StringConstants.INVALID_VERSION_MESSAGE,
        );
      }
    }
    return res;
  };

  deleteMany = async ({
    filter = {},
    options = {},
  }: {
    filter?: RootFilterQuery<TDocument>;
    options?: MongooseBaseQueryOptions<TDocument>;
  }): Promise<DeleteResult> => {
    return this.model.deleteMany(filter, options);
  };

  findOneAndDelete = async <TLean extends boolean = false>({
    filter = {},
    options = { new: true },
  }: {
    filter?: RootFilterQuery<TDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  }): Promise<FindOneFunctionsReturnType<TDocument, TLean>> => {
    return this.model.findOneAndDelete(filter, options);
  };

  replaceOne = async ({
    filter = {},
    replacement,
    options = {},
  }: {
    filter?: RootFilterQuery<TDocument>;
    replacement: TDocument;
    options?: MongooseBaseQueryOptions<TDocument>;
  }): Promise<UpdateWriteOpResult> => {
    return this.model.replaceOne(filter, replacement, options);
  };

  countDocuments = async ({
    filter = {},
  }: {
    filter?: RootFilterQuery<TDocument>;
  }): Promise<number> => {
    return this.model.countDocuments(filter);
  };

  exists = async ({
    filter,
  }: {
    filter: RootFilterQuery<TDocument>;
  }): Promise<{ _id: InferId<TDocument> } | null> => {
    return this.model.exists(filter);
  };

  aggregate = async <R extends Record<string, any>>({
    pipeline,
    options,
  }: {
    pipeline: PipelineStage[];
    options?: AggregateOptions;
  }): Promise<Aggregate<Array<R>>> => {
    return this.model.aggregate<R>(pipeline, options);
  };
}

export default DatabaseRepository;
