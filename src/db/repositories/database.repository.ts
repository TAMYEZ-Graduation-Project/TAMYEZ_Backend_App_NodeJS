import type {
  DeleteResult,
  MongooseBaseQueryOptions,
  UpdateWithAggregationPipeline,
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
import { BadRequestException } from "../../utils/exceptions/custom.exceptions.ts";
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
        StringConstants.FAILED_CREATE_INSTANCE_MESSAGE
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
    page = "all",
    size,
  }: {
    filter: RootFilterQuery<TDocument>;
    projection?: ProjectionType<TDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
    page: number | "all";
    size: number;
  }): Promise<IPaginationResult<TDocument, TLean>> => {
    let docsCount;
    let totalPages;
    if (page !== "all") {
      page = Math.floor(!page || page < 1 ? 1 : page);
      options.limit = Math.floor(!size || size < 1 ? 5 : size);
      options.skip = (page - 1) * size;

      docsCount = await this.model.countDocuments(filter);
      totalPages = Math.ceil(docsCount / size);
    }
    const data = await this.model.find(filter, projection, options);

    return {
      totalCount: docsCount,
      totalPages,
      currentPage: page !== "all" ? page : undefined,
      size: page !== "all" ? size : undefined,
      data: data as unknown as FindFunctionsReturnType<TDocument, TLean>,
    };
  };

  findOne = async <TLean extends boolean = false>({
    filter,
    projection,
    options = {},
  }: {
    filter?: RootFilterQuery<TDocument>;
    projection?: ProjectionType<TDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  }): Promise<FindOneFunctionsReturnType<TDocument, TLean>> => {
    return this.model.findOne(filter, projection, options);
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

  updateMany = async ({
    filter = {},
    update,
    options = {},
  }: {
    filter?: RootFilterQuery<TDocument>;
    update: UpdateQuery<TDocument> | UpdateWithAggregationPipeline;
    options?: MongooseUpdateQueryOptions<TDocument>;
  }): Promise<UpdateWriteOpResult> => {
    return this.model.updateMany(
      filter,
      {
        ...update,
        $inc: Object.assign((update as Record<string, any>)["$inc"] ?? {}, {
          __v: 1,
        }),
      },
      options
    );
  };

  updateOne = async <TUpdate extends UpdateType = Record<string, any>>({
    filter = {},
    update,
    options = {},
  }: {
    filter?: RootFilterQuery<TDocument>;
    update: UpdateFunctionsUpdateObjectType<TDocument, TUpdate>;
    options?: MongooseUpdateQueryOptions<TDocument>;
  }): Promise<UpdateWriteOpResult> => {
    let toUpdateObject;
    if (Array.isArray(update)) {
      update.push({
        $set: {
          __v: { $add: ["$__v", 1] },
        },
      });
      toUpdateObject = update;
    } else {
      toUpdateObject = {
        ...update,
        $inc: Object.assign((update as Record<string, any>)["$inc"] ?? {}, {
          __v: 1,
        }),
      };
    }
    return this.model.updateOne(filter, toUpdateObject, options);
  };

  updateById = async <TUpdate extends UpdateType>({
    id,
    update,
    options = {},
  }: {
    id: Types.ObjectId | string;
    update: UpdateFunctionsUpdateObjectType<TDocument, TUpdate>;
    options?: MongooseUpdateQueryOptions<TDocument>;
  }): Promise<UpdateWriteOpResult> => {
    let toUpdateObject;
    if (Array.isArray(update)) {
      update.push({
        $set: {
          __v: { $add: ["$__v", 1] },
        },
      });
      toUpdateObject = update;
    } else {
      toUpdateObject = {
        ...update,
        $inc: Object.assign((update as Record<string, any>)["$inc"] ?? {}, {
          __v: 1,
        }),
      };
    }
    return this.model.updateOne({ _id: id }, toUpdateObject, options);
  };

  findOneAndUpdate = async <TLean extends boolean = false>({
    filter = {},
    update,
    options = { new: true },
  }: {
    filter?: RootFilterQuery<TDocument>;
    update: UpdateQuery<TDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  }): Promise<FindOneFunctionsReturnType<TDocument, TLean>> => {
    return this.model.findOneAndUpdate(
      filter,
      {
        ...update,
        $inc: Object.assign((update as Record<string, any>)["$inc"] ?? {}, {
          __v: 1,
        }),
      },
      options
    );
  };

  findByIdAndUpdate = async <TLean extends LeanType = false>({
    id,
    update,
    options = { new: true },
  }: {
    id: Types.ObjectId | string;
    update: UpdateQuery<TDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  }): Promise<FindOneFunctionsReturnType<TDocument, TLean>> => {
    return this.model.findByIdAndUpdate(
      id,
      {
        ...update,
        $inc: Object.assign((update as Record<string, any>)["$inc"] ?? {}, {
          __v: 1,
        }),
      },
      options
    );
  };

  deleteOne = async ({
    filter = {},
    options = {},
  }: {
    filter?: RootFilterQuery<TDocument>;
    options?: MongooseBaseQueryOptions<TDocument>;
  }): Promise<DeleteResult> => {
    return this.model.deleteOne(filter, options);
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
}

export default DatabaseRepository;
