import type { Default__v, Require_id, Types } from "mongoose";

class DocumentFormat {
  static getIdFrom_Id = <TDocument>(
    documentInstance: Require_id<Default__v<TDocument>>,
  ): Omit<Require_id<TDocument>, "_id" | "__v"> & {
    id: Types.ObjectId | undefined;
    v: number | undefined;
  } => {
    const { _id, __v, ...restObject } = documentInstance;

    return { id: _id, ...restObject, v: __v as number | undefined };
  };
}

export default DocumentFormat;
