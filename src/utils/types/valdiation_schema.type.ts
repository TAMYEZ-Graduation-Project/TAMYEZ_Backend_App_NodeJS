import type { Request } from "express";
import type { ZodType } from "zod";

export type RequestKeysType = keyof Request;
export type ZodSchemaType = Partial<Record<RequestKeysType, ZodType>>;
