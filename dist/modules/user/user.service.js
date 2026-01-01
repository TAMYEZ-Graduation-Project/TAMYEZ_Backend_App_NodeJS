import successHandler from "../../utils/handlers/success.handler.js";
import S3Service from "../../utils/multer/s3.service.js";
import S3FoldersPaths from "../../utils/multer/s3_folders_paths.js";
import { LogoutFlagsEnum, ProvidersEnum, } from "../../utils/constants/enum.constants.js";
import DocumentFromat from "../../utils/formats/document.format.js";
import UpdateUtil from "../../utils/update/util.update.js";
import HashingSecurityUtil from "../../utils/security/hash.security.js";
import { BadRequestException, NotFoundException, } from "../../utils/exceptions/custom.exceptions.js";
import StringConstants from "../../utils/constants/strings.constants.js";
import TokenSecurityUtil from "../../utils/security/token.security.js";
import { NotificationPushDeviceRepository } from "../../db/repositories/index.js";
import NotificationPushDeviceModel from "../../db/models/notifiction_push_device.model.js";
class UserService {
    _notificationPushDeviceRepository = new NotificationPushDeviceRepository(NotificationPushDeviceModel);
    getProfile = async (req, res) => {
        return successHandler({ res, body: { user: req.user } });
    };
    uploadProfilePicture = async (req, res) => {
        const { attachment } = req.body;
        const s3OperationsList = [
            S3Service.uploadFile({
                File: attachment,
                Path: S3FoldersPaths.profileFolderPath(req.user._id.toString()),
            }),
        ];
        if (req.user?.profilePicture &&
            req.user.profilePicture.provider === ProvidersEnum.local) {
            s3OperationsList.push(S3Service.deleteFile({
                SubKey: req.user.profilePicture.url,
            }));
        }
        const [subKey, _] = await Promise.all(s3OperationsList);
        await req.user.updateOne({
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
    updateProfile = async (req, res) => {
        const { firstName, lastName, phoneNumber, gender } = req.body;
        const updatedObject = UpdateUtil.getChangedFields({
            document: req.user,
            updatedObject: { firstName, lastName, phoneNumber, gender },
        });
        if (updatedObject.gender && req.user.gender) {
            throw new BadRequestException("Gender can't be changed after first selection 🚻");
        }
        await req.user.updateOne({
            ...updatedObject,
        });
        return successHandler({ res });
    };
    changePassword = async (req, res) => {
        const { currentPassword, newPassword, flag } = req.validationResult
            .body;
        if (!(await HashingSecurityUtil.compareHash({
            plainText: currentPassword,
            cipherText: req.user.password,
        }))) {
            throw new BadRequestException(StringConstants.INVALID_PARAMETER_MESSAGE("currentPassword"));
        }
        const updateObject = {};
        switch (flag) {
            case LogoutFlagsEnum.all:
                updateObject.changeCredentialsTime = new Date();
                break;
            case LogoutFlagsEnum.one:
                await TokenSecurityUtil.revoke({
                    flag,
                    userId: req.user._id,
                    tokenPayload: req.tokenPayload,
                });
                break;
            default:
                break;
        }
        await req.user.updateOne({
            password: newPassword,
            ...updateObject,
        });
        return successHandler({ res });
    };
    logout = async (req, res) => {
        const { flag, deviceId } = req.validationResult.body;
        if (deviceId) {
            const pushDeviceResult = await this._notificationPushDeviceRepository.updateOne({
                filter: { userId: req.user._id, deviceId },
                update: {
                    isActive: false,
                    $unset: { fcmToken: true },
                },
            });
            if (!pushDeviceResult?.matchedCount) {
                throw new NotFoundException("Invalid deviceId, or notification is disabled ❌");
            }
        }
        await TokenSecurityUtil.revoke({
            flag,
            userId: req.user._id,
            tokenPayload: req.tokenPayload,
        });
        return successHandler({ res });
    };
}
export default UserService;
