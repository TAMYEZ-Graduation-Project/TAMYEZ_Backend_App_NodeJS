import { z } from "zod";
import type RoadmapValidators from "./roadmap.validation.ts";

export type CreateRoadmapStepBodyDto = z.infer<
  typeof RoadmapValidators.createRoadmapStep.body
>;

export type GetRoadmapQueryDto = z.infer<
  typeof RoadmapValidators.getRoadmap.query
>;

export type GetRoadmapStepParamsDto = z.infer<
  typeof RoadmapValidators.getRoadmapStep.params
>;

export type UpdateRoadmapStepParamsDto = z.infer<
  typeof RoadmapValidators.updateRoadmapStep.params
>;

export type UpdateRoadmapStepBodyDto = z.infer<
  typeof RoadmapValidators.updateRoadmapStep.body
>;

export type UpdateRoadmapStepResourceParamsDto = z.infer<
  typeof RoadmapValidators.updateRoadmapStepResource.params
>;

export type UpdateRoadmapResourceStepBodyDto = z.infer<
  typeof RoadmapValidators.updateRoadmapStepResource.body
>;

export type ArchiveRoadmapStepParamsDto = z.infer<
  typeof RoadmapValidators.archiveRoadmapStep.params
>;

export type ArchiveRoadmapStepBodyDto = z.infer<
  typeof RoadmapValidators.archiveRoadmapStep.body
>;

export type RestoreRoadmapStepParamsDto = z.infer<
  typeof RoadmapValidators.restoreRoadmapStep.params
>;

export type RestoreRoadmapStepBodyDto = z.infer<
  typeof RoadmapValidators.restoreRoadmapStep.body
>;

export type DeleteRoadmapStepParamsDto = z.infer<
  typeof RoadmapValidators.deleteRoadmapStep.params
>;

export type DeleteRoadmapStepBodyDto = z.infer<
  typeof RoadmapValidators.deleteRoadmapStep.body
>;
