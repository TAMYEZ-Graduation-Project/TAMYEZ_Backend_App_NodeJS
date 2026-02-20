import type { Types } from "mongoose";

abstract class S3FoldersPaths {
  static userFolderPath = (userId: string): string => {
    return `users/${userId}`;
  };

  static profileFolderPath = (userId: string): string => {
    return `${this.userFolderPath(userId)}/profile`;
  };

  static careerFolderPath = (assetFolderId: string): string => {
    return `careers/${assetFolderId}`;
  };

  static careerResourceFolderPath = (
    assetFolderId: string,
    resourceName: string,
  ): string => {
    return `careers/${assetFolderId}/${resourceName}`;
  };

  static roadmapStepFolderPath = (
    assetFolderId: string,
    stepId: Types.ObjectId | string,
  ) => {
    return `careers/${assetFolderId}/roadmap/${stepId.toString()}`;
  };

  static roadmapStepResourceFolderPath = (
    assetFolderId: string,
    resourceName: string,
    stepId: Types.ObjectId | string,
  ) => {
    return `careers/${assetFolderId}/roadmap/${stepId.toString()}/${resourceName}`;
  };
}

export default S3FoldersPaths;
