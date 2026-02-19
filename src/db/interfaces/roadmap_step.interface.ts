import type { Default__v, HydratedDocument, Require_id, Types } from "mongoose";

import type { IAtByObject, IRoadmapStepResource } from "./common.interface.ts";

export interface IRoadmapStep {
  id?: Types.ObjectId | undefined; // virtual
  careerId: Types.ObjectId;

  order: number;

  title: string;
  description: string;

  courses: IRoadmapStepResource[];
  youtubePlaylists: IRoadmapStepResource[];
  books: IRoadmapStepResource[];

  allowGlobalResources?: boolean;

  quizzesIds: Types.ObjectId[];

  freezed?: IAtByObject;
  restored?: IAtByObject;

  createdAt: Date;
  updatedAt: Date;
}

export type FullIRoadmapStep = Require_id<Default__v<IRoadmapStep>>;

export type HIRoadmapStepType = HydratedDocument<IRoadmapStep>;
