import type {
  FlattenMaps,
  Require_id,
  HydratedDocument,
  QueryOptions,
  LeanOptions,
} from "mongoose";

export type LeanType = boolean | LeanOptions;

export type FindFunctionOptionsType<TDocument, TLean> =
  QueryOptions<TDocument> & {
    lean?: TLean;
  };

export type FindOneFunctionsReturnType<T, Lean extends LeanType> = Lean extends
  | true
  | LeanOptions
  ? Require_id<FlattenMaps<T>> | null
  : HydratedDocument<T> | null;

export type FindFunctionsReturnType<T, Lean extends LeanType> = Array<
  Lean extends true | LeanOptions
    ? Require_id<FlattenMaps<T>>
    : HydratedDocument<T>
> | null;
