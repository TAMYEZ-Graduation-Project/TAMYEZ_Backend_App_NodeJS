import type { Request, Response } from "express";
import {
  NotificationPushDeviceModel,
  UserModel,
} from "../../db/models/index.ts";
import {
  NotificationPushDeviceRepository,
  UserRepository,
} from "../../db/repositories/index.ts";
import successHandler from "../../utils/handlers/success.handler.ts";
import type {
  ForgetPasswordBodyDtoType,
  LogInBodyDtoType,
  ResendEmailVerificationLinkBodyDtoType,
  ResetForgetPasswordBodyDtoType,
  SignUpBodyDtoType,
  SignUpLogInGmailBodyDtoType,
  VerifyEmailQueryDtoType,
  VerifyForgetPasswordBodyDtoType,
} from "./auth.dto.ts";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServerException,
} from "../../utils/exceptions/custom.exceptions.ts";
import IdSecurityUtil from "../../utils/security/id.security.ts";
import EnvFields from "../../utils/constants/env_fields.constants.ts";
import emailEvent from "../../utils/events/email.events.ts";
import {
  EmailStatusEnum,
  EmailEventsEnum,
  OTPsOrLinksEnum,
  ProvidersEnum,
  ApplicationTypeEnum,
  RolesEnum,
} from "../../utils/constants/enum.constants.ts";
import RoutePaths from "../../utils/constants/route_paths.constants.ts";
import EncryptionSecurityUtil from "../../utils/security/encryption.security.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";
import responseHtmlHandler from "../../utils/handlers/success_html.handler.ts";
import HTML_VERIFY_EMAIL_TEMPLATE from "../../utils/email/templates/html_verify_email.template.ts";
import OTPSecurityUtil from "../../utils/security/otp.security.ts";
import HashingSecurityUtil from "../../utils/security/hash.security.ts";
import TokenSecurityUtil from "../../utils/security/token.security.ts";
import type {
  ILogInResponse,
  ISignUpLogInGmailResponse,
} from "./auth.entity.ts";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import type { IProfilePictureObject } from "../../db/interfaces/common.interface.ts";
import type { Types } from "mongoose";

class AuthService {
  private _userRepository = new UserRepository(UserModel);
  private readonly _notificationPushDeviceRepository =
    new NotificationPushDeviceRepository(NotificationPushDeviceModel);

  private _sendTokenToUser = ({
    email,
    otp,
  }: {
    email: string;
    otp: string;
  }) => {
    const fullToken = EncryptionSecurityUtil.encryptText({
      plainText: decodeURIComponent(`${email} ${otp}`),
      secretKey: process.env[EnvFields.EMAIL_VERIFICATION_TOKEN_ENC_KEY]!,
    });

    emailEvent.publish({
      eventName: EmailEventsEnum.emailVerification,
      payload: {
        to: email,
        otpOrLink: `${process.env[EnvFields.PROTOCOL]}://${
          process.env[EnvFields.HOST]
        }${RoutePaths.API_V1_PATH}${RoutePaths.auth}${
          RoutePaths.verifyEmail
        }?token=${encodeURIComponent(fullToken)}`,
      },
    });
  };

  signUp = async (req: Request, res: Response) => {
    const {
      fullName,
      email,
      password,
      gender,
      phoneNumber,
    }: SignUpBodyDtoType = req.body as SignUpBodyDtoType;
    const emailExists = await this._userRepository.findByEmail({ email });

    if (emailExists) {
      throw new ConflictException("email already exists!");
    }

    const otp = IdSecurityUtil.generateAlphaNumericId();

    await this._userRepository.create({
      data: [
        {
          fullName,
          email,
          password,
          gender,
          phoneNumber,
          confirmEmailLink: {
            code: await HashingSecurityUtil.hashText({
              plainText: otp,
            }),
            expiresAt: new Date(
              Date.now() +
                Number(process.env[EnvFields.OTP_EXPIRES_IN_MILLISECONDS]),
            ),
            count: 0,
          },
        },
      ],
    });

    this._sendTokenToUser({ email, otp });

    return successHandler({
      res,
      message: StringConstants.SINGED_UP_SUCCESSFUL_WITH_LINK_MESSAGE,
    });
  };

  verifyEmail = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { token } = req.query as VerifyEmailQueryDtoType;

      const tokenAfterDecryption = EncryptionSecurityUtil.decryptText({
        cipherText: decodeURIComponent(token),
        secretKey: process.env[EnvFields.EMAIL_VERIFICATION_TOKEN_ENC_KEY]!,
      });

      const [email, otp] = tokenAfterDecryption.split(" ");

      const user = await this._userRepository.findOne({
        filter: {
          email,
          confirmEmailLink: { $exists: true },
          freezed: { $exists: false },
          confirmedAt: { $exists: false },
        },
      });

      if (!user) {
        throw new BadRequestException(
          StringConstants.INVALID_EMAIL_ACCOUNT_OR_VARIFIED_MESSAGE,
        );
      }

      if (Date.now() >= user.confirmEmailLink!.expiresAt.getTime()) {
        throw new BadRequestException(
          StringConstants.EMAIL_VERIFICATION_LINK_EXPIRE_MESSAGE,
        );
      }

      if (
        !(await HashingSecurityUtil.compareHash({
          plainText: otp!,
          cipherText: user!.confirmEmailLink!.code!,
        }))
      ) {
        throw new BadRequestException(StringConstants.INVALID_TOKEN_MESSAGE);
      }

      await user.updateOne({
        $unset: { confirmEmailLink: true },
        confirmedAt: new Date(),
      });

      return responseHtmlHandler({
        res,
        htmlContent: HTML_VERIFY_EMAIL_TEMPLATE({
          logoUrl: process.env[EnvFields.LOGO_URL]!,
        }),
      });
    } catch (error: any) {
      return responseHtmlHandler({
        res,
        htmlContent: HTML_VERIFY_EMAIL_TEMPLATE({
          logoUrl: process.env[EnvFields.LOGO_URL]!,
          success: false,
          failureMessage: error?.message,
        }),
      });
    }
  };

  resendEmailVerificationLink = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { email } = req.body as ResendEmailVerificationLinkBodyDtoType;

    const user = await this._userRepository.findOne({
      filter: {
        email,
        freezed: { $exists: false },
      },
    });

    const count = OTPSecurityUtil.checkRequestOfNewOTP({ user });

    const otp = IdSecurityUtil.generateAlphaNumericId();

    await user?.updateOne({
      confirmEmailLink: {
        code: await HashingSecurityUtil.hashText({ plainText: otp }),
        expiresAt:
          Date.now() +
          Number(process.env[EnvFields.OTP_EXPIRES_IN_MILLISECONDS]),
        count,
      },
    });

    this._sendTokenToUser({ email, otp });

    return successHandler({
      res,
      message: StringConstants.RESENT_EMAIL_VERIFICATION_LINK_MESSAGE,
    });
  };

  private _checkNotificationsForPushDevice = async ({
    userId,
    jwtTokenExpiresAt,
    deviceId,
    fcmToken,
  }: {
    userId: Types.ObjectId;
    jwtTokenExpiresAt: Date;
    deviceId: string;
    fcmToken: string;
  }): Promise<boolean> => {
    const result = await this._notificationPushDeviceRepository.updateOne({
      filter: {
        userId,
        deviceId,
        __v: undefined,
      },
      update: { fcmToken, isActive: true, jwtTokenExpiresAt },
    });

    if (!result.matchedCount) {
      return false;
    }

    return true;
  };

  logIn = ({
    applicationType = ApplicationTypeEnum.user,
  }: {
    applicationType?: ApplicationTypeEnum;
  } = {}) => {
    return async (req: Request, res: Response): Promise<Response> => {
      const { email, password, deviceId, fcmToken } =
        req.body as LogInBodyDtoType;

      const user = await this._userRepository.findOne({
        filter: {
          email,
          confirmedAt: { $exists: true },
        },
      });

      if (!user) {
        throw new NotFoundException(
          StringConstants.INVALID_USER_ACCOUNT_MESSAGE,
        );
      }
      if (
        applicationType === ApplicationTypeEnum.adminDashboard &&
        user.role === RolesEnum.user
      ) {
        throw new ForbiddenException(
          "Not authorized to login to the admin dashboard ❌⚠️",
        );
      }

      if (
        !(await HashingSecurityUtil.compareHash({
          plainText: password,
          cipherText: user.password!,
        }))
      ) {
        throw new BadRequestException(
          StringConstants.INVALID_LOGIN_CREDENTIALS_MESSAGE,
        );
      }
      const { accessToken } = TokenSecurityUtil.getTokensBasedOnRole({
        user,
        applicationType,
      });

      let notificationsEnabled;
      if (deviceId && fcmToken && applicationType === ApplicationTypeEnum.user)
        notificationsEnabled = await this._checkNotificationsForPushDevice({
          userId: user._id,
          jwtTokenExpiresAt: new Date(
            TokenSecurityUtil.getTokenExpiresAt({
              userRole: user.role,
              token: accessToken,
            }) * 1000,
          ),
          deviceId,
          fcmToken,
        });

      return successHandler<ILogInResponse>({
        res,
        message: StringConstants.LOG_IN_SUCCESSFUL_MESSAGE,
        body: {
          accessToken,
          notificationsEnabled,
          user,
        },
      });
    };
  };

  // Social Login/Signup with gmail

  private _verifyGmailAccount = async ({
    idToken,
  }: {
    idToken: string;
  }): Promise<TokenPayload> => {
    try {
      const client = new OAuth2Client();
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env[EnvFields.WEB_CLIENT_IDS]?.split(",") || [], // Specify the WEB_CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
      });
      const payload = ticket.getPayload();
      // This ID is unique to each Google Account, making it suitable for use as a primary key
      // during account lookup. Email is not a good choice because it can be changed by the user.

      if (!payload?.email_verified) {
        throw new BadRequestException(
          StringConstants.FAILED_VERIFY_GMAIL_ACCOUNT_MESSAGE,
        );
      }
      return payload;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to verify idToken ❌. Error: ${error?.message}`,
      );
    }
  };

  signUpWithGmail = async (req: Request, res: Response): Promise<Response> => {
    const { idToken, deviceId, fcmToken } =
      req.body as SignUpLogInGmailBodyDtoType;

    const { email, given_name, family_name, picture } =
      await this._verifyGmailAccount({ idToken });

    if (!email || !given_name || given_name.length < 2) {
      throw new BadRequestException(
        StringConstants.INVALID_GMAIL_CREDENTIALS_MESSAGE,
      );
    }

    const userExist = await this._userRepository.findByEmail({
      email,
    });

    if (userExist) {
      if (userExist.authProvider === ProvidersEnum.google) {
        return await this.logInWithGmail()(req, res);
      }
      throw new ConflictException(
        StringConstants.EMAIL_EXISTS_PROVIDER_MESSAGE,
      );
    }

    const objectToCreate: {
      profilePicture?: IProfilePictureObject;
    } = {};
    if (picture && picture.length != 0) {
      objectToCreate.profilePicture = {
        url: picture,
        provider: ProvidersEnum.google,
      };
    }

    const [user] = await this._userRepository.create({
      data: [
        {
          firstName: given_name,
          lastName:
            family_name || `${IdSecurityUtil.generateNumericId({ size: 3 })}`,
          email,
          confirmedAt: new Date(),
          authProvider: ProvidersEnum.google,
          ...objectToCreate,
        },
      ],
    });

    if (!user) {
      throw new ServerException(
        "Failed to create user account, please try again later ☹️",
      );
    }

    const { accessToken } = TokenSecurityUtil.getTokensBasedOnRole({
      user: user,
      applicationType: ApplicationTypeEnum.user,
    });

    let notificationsEnabled;
    if (deviceId && fcmToken)
      notificationsEnabled = await this._checkNotificationsForPushDevice({
        userId: user._id,
        jwtTokenExpiresAt: new Date(
          TokenSecurityUtil.getTokenExpiresAt({
            userRole: user.role,
            token: accessToken,
          }) * 1000,
        ),
        deviceId,
        fcmToken,
      });

    return successHandler<ISignUpLogInGmailResponse>({
      res,
      statusCode: 201,
      message: StringConstants.SINGED_UP_SUCCESSFUL_MESSAGE,
      body: {
        accessToken,
        notificationsEnabled,
        user: user!,
      },
    });
  };

  logInWithGmail = ({
    applicationType = ApplicationTypeEnum.user,
  }: { applicationType?: ApplicationTypeEnum } = {}) => {
    return async (req: Request, res: Response): Promise<Response> => {
      const { idToken, deviceId, fcmToken } =
        req.body as SignUpLogInGmailBodyDtoType;

      const { email } = await this._verifyGmailAccount({ idToken });

      if (!email) {
        throw new BadRequestException(
          StringConstants.INVALID_GMAIL_CREDENTIALS_MESSAGE,
        );
      }

      const user = await this._userRepository.findOne({
        filter: {
          email,
          authProvider: ProvidersEnum.google,
        },
      });

      if (!user) {
        throw new NotFoundException(
          StringConstants.INVALID_USER_ACCOUNT_MESSAGE +
            " or " +
            StringConstants.EMAIL_EXISTS_PROVIDER_MESSAGE,
        );
      }

      if (
        applicationType === ApplicationTypeEnum.adminDashboard &&
        user.role === RolesEnum.user
      ) {
        throw new ForbiddenException(
          "Not authorized to login to the admin dashboard ❌⚠️",
        );
      }

      const { accessToken } = TokenSecurityUtil.getTokensBasedOnRole({
        user,
        applicationType,
      });

      let notificationsEnabled;
      if (deviceId && fcmToken && applicationType === ApplicationTypeEnum.user)
        notificationsEnabled = await this._checkNotificationsForPushDevice({
          userId: user._id,
          jwtTokenExpiresAt: new Date(
            TokenSecurityUtil.getTokenExpiresAt({
              userRole: user.role,
              token: accessToken,
            }) * 1000,
          ),
          deviceId,
          fcmToken,
        });

      return successHandler<ISignUpLogInGmailResponse>({
        res,
        message: StringConstants.LOG_IN_SUCCESSFUL_MESSAGE,
        body: {
          accessToken,
          notificationsEnabled,
          user,
        },
      });
    };
  };

  forgetPassword = async (req: Request, res: Response): Promise<Response> => {
    const { email } = req.body as ForgetPasswordBodyDtoType;

    const user = await this._userRepository.findOne({
      filter: {
        email,
        freezed: { $exists: false },
      },
    });

    if (!user) {
      throw new NotFoundException(StringConstants.INVALID_USER_ACCOUNT_MESSAGE);
    }

    if (
      user.lastResetPasswordAt &&
      Date.now() <
        user.lastResetPasswordAt.getTime() +
          Number(
            process.env[
              EnvFields.TIME_ELAPSED_TO_RESET_PASSWORD_IN_MILLISECONDS
            ],
          )
    ) {
      throw new BadRequestException(
        StringConstants.RESET_PASSWORD_RECENTLY_MESSAGE,
      );
    }

    const count = OTPSecurityUtil.checkRequestOfNewOTP({
      user,
      otpType: OTPsOrLinksEnum.forgetPasswordOTP,
      checkEmailStatus: EmailStatusEnum.confirmed,
    });

    const otp = IdSecurityUtil.generateNumericId();

    await this._userRepository.updateOne({
      filter: {
        _id: user._id!,
        __v: user.__v,
      },
      update: {
        $unset: {
          forgetPasswordVerificationExpiresAt: 1,
        },
        forgetPasswordOtp: {
          code: await HashingSecurityUtil.hashText({ plainText: otp }),
          expiresAt: new Date(
            Date.now() +
              Number(process.env[EnvFields.OTP_EXPIRES_IN_MILLISECONDS]),
          ),
          count,
        },
      },
    });

    emailEvent.publish({
      eventName: EmailEventsEnum.forgetPassword,
      payload: { to: email, otpOrLink: otp },
    });

    return successHandler({ res, message: StringConstants.OTP_SENT_MESSAGE });
  };

  verifyForgetPassword = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { email, otp } = req.body as VerifyForgetPasswordBodyDtoType;

    const user = await this._userRepository.findOne({
      filter: {
        email,
        freezed: { $exists: false },
        forgetPasswordOtp: { $exists: true },
      },
    });

    if (!user) {
      throw new NotFoundException(StringConstants.INVALID_USER_ACCOUNT_MESSAGE);
    }

    if (
      Date.now() >= user.forgetPasswordOtp!.expiresAt.getTime() ||
      !(await HashingSecurityUtil.compareHash({
        plainText: otp,
        cipherText: user.forgetPasswordOtp!.code!,
      }))
    ) {
      throw new BadRequestException(StringConstants.INVALID_OTP_MESSAGE);
    }

    await this._userRepository.updateOne({
      filter: {
        _id: user._id!,
        __v: user.__v,
      },
      update: {
        $unset: {
          forgetPasswordOtp: 1,
        },
        forgetPasswordVerificationExpiresAt:
          Date.now() +
          Number(process.env[EnvFields.OTP_EXPIRES_IN_MILLISECONDS]),
      },
    });

    return successHandler({
      res,
      message: StringConstants.OTP_VERIFIED_MESSAGE,
    });
  };

  resetForgetPassword = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { email, password } = req.body as ResetForgetPasswordBodyDtoType;

    const user = await this._userRepository.findOne({
      filter: {
        email,
        freezed: { $exists: false },
        forgetPasswordVerificationExpiresAt: { $exists: true },
      },
    });

    if (!user) {
      throw new NotFoundException(StringConstants.INVALID_USER_ACCOUNT_MESSAGE);
    }

    if (Date.now() >= user.forgetPasswordVerificationExpiresAt!.getTime()) {
      throw new BadRequestException(
        StringConstants.FORGET_PASSWORD_VERIFICATION_EXPIRE_MESSAGE,
      );
    }

    await user.updateOne({
      $unset: { forgetPasswordVerificationExpiresAt: 1 },
      password: await HashingSecurityUtil.hashText({ plainText: password }),
      lastResetPasswordAt: new Date(),
      changeCredentialsTime: new Date(),
    });

    return successHandler({
      res,
      message: StringConstants.PASSWORD_RESET_SUCCESSFULLY_MESSAGE,
    });
  };
}

export default new AuthService();
