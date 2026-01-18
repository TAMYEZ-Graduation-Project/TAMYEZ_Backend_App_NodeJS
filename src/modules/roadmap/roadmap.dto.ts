import { z } from "zod";
import type RoadmapValidators from "./roadmap.validation.ts";

export type CreateRoadmapStepBodyDto = z.infer<
  typeof RoadmapValidators.createRoadmapStep.body
>;

export type UpdateRoadmapStepParamsDto = z.infer<
  typeof RoadmapValidators.updateRoadmapStep.params
>;

export type UpdateRoadmapStepBodyDto = z.infer<
  typeof RoadmapValidators.updateRoadmapStep.body
>;
