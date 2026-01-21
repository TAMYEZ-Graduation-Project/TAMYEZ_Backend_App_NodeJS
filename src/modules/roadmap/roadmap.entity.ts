import type { IRoadmapStepResource } from "../../db/interfaces/common.interface.ts";

export interface UpdateRoadmapStepResourceResponse {
  courses?: IRoadmapStepResource | undefined;
  youtubePlaylists?: IRoadmapStepResource | undefined;
  books?: IRoadmapStepResource | undefined;
}
