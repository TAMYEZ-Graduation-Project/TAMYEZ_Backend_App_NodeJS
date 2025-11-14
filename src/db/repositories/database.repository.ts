import type { UpdateWriteOpResult } from "mongoose";
import type {
  HydratedDocument,
  MongooseUpdateQueryOptions,
  ProjectionType,
  QueryOptions,
  RootFilterQuery,
  Types,
  UpdateQuery,
} from "mongoose";
import type { CreateOptions, Model } from "mongoose";
import { BadRequestException } from "../../utils/exceptions/custom.exceptions.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";

abstract class DatabaseRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  create = async ({
    data,
    options = {
      validateBeforeSave: true,
    },
  }: {
    data: Partial<TDocument>[];
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

  findOne = async ({
    filter,
    projection,
    options = {},
  }: {
    filter?: RootFilterQuery<TDocument>;
    projection?: ProjectionType<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> => {
    return this.model.findOne(filter, projection, options);
  };

  findById = async ({
    id,
    projection,
    options = {},
  }: {
    id: Types.ObjectId | string;
    projection?: ProjectionType<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> => {
    return this.model.findById(id, projection, options);
  };

  updateOne = async ({
    filter = {},
    update,
    options = { runValidators: true },
  }: {
    filter?: RootFilterQuery<TDocument>;
    update: UpdateQuery<TDocument>;
    options?: MongooseUpdateQueryOptions<TDocument>;
  }): Promise<UpdateWriteOpResult> => {
    return this.model.updateOne(
      filter,
      { ...update, $inc: { __v: 1 } },
      options
    );
  };

  updateById = async ({
    id,
    update,
    options = {},
  }: {
    id: Types.ObjectId | string;
    update: UpdateQuery<TDocument>;
    options?: MongooseUpdateQueryOptions<TDocument>;
  }): Promise<UpdateWriteOpResult> => {
    return this.model.updateOne(
      { _id: id },
      { ...update, $inc: { __v: 1 } },
      options
    );
  };

  findOneAndUpdate = async ({
    filter = {},
    update,
    options = { new: true },
  }: {
    filter?: RootFilterQuery<TDocument>;
    update: UpdateQuery<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> => {
    return this.model.findOneAndUpdate(
      filter,
      { ...update, $inc: { __v: 1 } },
      options
    );
  };

  findByIdAndUpdate = async ({
    id,
    update,
    options = { new: true },
  }: {
    id: Types.ObjectId | string;
    update: UpdateQuery<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> => {
    return this.model.findByIdAndUpdate(
      id,
      { ...update, $inc: { __v: 1 } },
      options
    );
  };
}

export default DatabaseRepository;
