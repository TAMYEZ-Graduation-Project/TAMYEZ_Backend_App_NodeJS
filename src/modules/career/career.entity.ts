import type { ICareerResource } from "../../db/interfaces/common.interface.ts";
import type { HIUserType } from "../../db/interfaces/user.interface.ts";

export interface UpdateCareerResourceResponse {
  courses?: ICareerResource | undefined;
  youtubePlaylists?: ICareerResource | undefined;
  books?: ICareerResource | undefined;
  v: number;
}

export interface UploadCareerPictureResponse {
  pictureUrl: string;
}

export interface ChooseSuggestedCareerResponse {
  user: HIUserType;
}
