import type { Request, Response } from "express";
import successHandler from "../../utils/handlers/success.handler.ts";
import type { IProfileReponse } from "./user.entity.ts";
import type {
  ChangePasswordBodyDtoType,
  LogoutBodyDtoType,
  UpdateProfileBodyDtoType,
  UploadProfilePictureBodyDtoType,
} from "./user.dto.ts";
import S3Service from "../../utils/multer/s3.service.ts";
import S3FoldersPaths from "../../utils/multer/s3_folders_paths.ts";
import {
  LogoutFlagsEnum,
  ProvidersEnum,
} from "../../utils/constants/enum.constants.ts";
import DocumentFromat from "../../utils/formats/document.format.ts";
import UpdateUtil from "../../utils/update/util.update.ts";
import HashingSecurityUtil from "../../utils/security/hash.security.ts";
import {
  BadRequestException,
  NotFoundException,
} from "../../utils/exceptions/custom.exceptions.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";
import TokenSecurityUtil from "../../utils/security/token.security.ts";
import { NotificationPushDeviceRepository } from "../../db/repositories/index.ts";
import NotificationPushDeviceModel from "../../db/models/notifiction_push_device.model.ts";

class UserService {
  private readonly _notificationPushDeviceRepository =
    new NotificationPushDeviceRepository(NotificationPushDeviceModel);

  getProfile = async (req: Request, res: Response): Promise<Response> => {
    return successHandler<IProfileReponse>({ res, body: { user: req.user! } });
  };

  uploadProfilePicture = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { attachment } = req.body as UploadProfilePictureBodyDtoType;

    const s3OperationsList: Promise<any>[] = [
      S3Service.uploadFile({
        File: attachment,
        Path: S3FoldersPaths.profileFolderPath(req.user!._id!.toString()),
      }),
    ];
    if (
      req.user?.profilePicture &&
      req.user.profilePicture.provider === ProvidersEnum.local
    ) {
      s3OperationsList.push(
        S3Service.deleteFile({
          SubKey: req.user.profilePicture.url,
        })
      );
    }

    const [subKey, _] = await Promise.all(s3OperationsList);

    await req.user!.updateOne({
      profilePicture: {
        url: subKey,
        provide: ProvidersEnum.local,
      },
    });

    return successHandler({
      res,
      body: { url: DocumentFromat.getFullURLFromSubKey(subKey) },
    });
  };

  updateProfile = async (req: Request, res: Response): Promise<Response> => {
    const { firstName, lastName, phoneNumber, gender } =
      req.body as UpdateProfileBodyDtoType;

    const updatedObject = UpdateUtil.getChangedFields({
      document: req.user!,
      updatedObject: { firstName, lastName, phoneNumber, gender },
    });

    if (updatedObject.gender && req.user!.gender) {
      throw new BadRequestException(
        "Gender can't be changed after first selection 🚻"
      );
    }
    await req.user!.updateOne({
      ...updatedObject,
    });

    return successHandler({ res });
  };

  changePassword = async (req: Request, res: Response): Promise<Response> => {
    const { currentPassword, newPassword, flag } = req.validationResult
      .body as ChangePasswordBodyDtoType;

    if (
      !(await HashingSecurityUtil.compareHash({
        plainText: currentPassword,
        cipherText: req.user!.password,
      }))
    ) {
      throw new BadRequestException(
        StringConstants.INVALID_PARAMETER_MESSAGE("currentPassword")
      );
    }

    const updateObject: { changeCredentialsTime?: Date } = {};
    switch (flag) {
      case LogoutFlagsEnum.all:
        updateObject.changeCredentialsTime = new Date();
        break;

      case LogoutFlagsEnum.one:
        await TokenSecurityUtil.revoke({
          flag,
          userId: req.user!._id!,
          tokenPayload: req.tokenPayload!,
        });
        break;

      default:
        break;
    }

    await req.user!.updateOne({
      password: newPassword,
      ...updateObject,
    });

    return successHandler({ res });
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    const { flag, deviceId } = req.validationResult.body as LogoutBodyDtoType;

    if (deviceId) {
      const pushDeviceResult =
        await this._notificationPushDeviceRepository.updateOne({
          filter: { userId: req.user!._id!, deviceId },
          update: {
            isActive: false,
            $unset: { fcmToken: true },
          },
        });
      if (!pushDeviceResult?.matchedCount) {
        throw new NotFoundException(
          "Invalid deviceId, or notification is disabled ❌"
        );
      }
    }

    await TokenSecurityUtil.revoke({
      flag,
      userId: req.user!._id,
      tokenPayload: req.tokenPayload!,
    });

    return successHandler({ res });
  };
}

export default UserService;
