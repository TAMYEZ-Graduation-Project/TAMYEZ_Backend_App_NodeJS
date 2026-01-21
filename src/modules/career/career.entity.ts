import type { ICareerResource } from "../../db/interfaces/common.interface.ts";

export interface UpdateCareerResourceResponse {
  courses?: ICareerResource | undefined;
  youtubePlaylists?: ICareerResource | undefined;
  books?: ICareerResource | undefined;
}

export interface UploadCareerPictureResponse {
  pictureUrl: string;
}
