import type { Request, Response } from "express";
import UserModel from "../../db/models/user.model.ts";
import UserRepository from "../../db/repositories/user.respository.ts";
import successHandler from "../../utils/handlers/success.handler.ts";
import type {
  ForgetPasswordBodyDtoType,
  LogInBodyDtoType,
  ResendEmailVerificationLinkBodyDtoType,
  ResetForgetPasswordBodyDtoType,
  SignUpBodyDtoType,
  VerifyEmailQueryDtoType,
  VerifyForgetPasswordBodyDtoType,
} from "./auth.dto.ts";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../utils/exceptions/custom.exceptions.ts";
import IdSecurityUtil from "../../utils/security/id.security.ts";
import EnvFields from "../../utils/constants/env_fields.constants.ts";
import emailEvent from "../../utils/events/email.events.ts";
import {
  EmailStatusEnum,
  EventsEnum,
  OTPsOrLinksEnum,
} from "../../utils/constants/enum.constants.ts";
import RoutePaths from "../../utils/constants/route_paths.constants.ts";
import EncryptionSecurityUtil from "../../utils/security/encryption.security.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";
import successHtmlHandler from "../../utils/handlers/success_html.handler.ts";
import HTML_VERIFY_EMAIL_TEMPLATE from "../../utils/email/templates/html_verify_email.template.ts";
import OTPSecurityUtil from "../../utils/security/otp.security.ts";
import HashingSecurityUtil from "../../utils/security/hash.security.ts";
import TokenSecurityUtil from "../../utils/security/token.security.ts";
import type { ILogInResponse } from "./auth.entity.ts";

class AuthService {
  private _userRespository = new UserRepository(UserModel);

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
      eventName: EventsEnum.emailVerification,
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
    const { fullName, email, password, gender }: SignUpBodyDtoType =
      req.body as SignUpBodyDtoType;

    const emailExists = await this._userRespository.findByEmail({ email });

    if (emailExists) {
      throw new ConflictException("email already exists!");
    }

    const otp = IdSecurityUtil.generateAlphaNumericId();

    await this._userRespository.create({
      data: [
        {
          fullName,
          email,
          password: await HashingSecurityUtil.hashText({ plainText: password }),
          gender,
          confirmEmailLink: {
            code: await HashingSecurityUtil.hashText({
              plainText: otp,
            }),
            expiresAt: new Date(
              Date.now() +
                Number(process.env[EnvFields.OTP_EXPIRES_IN_MILLISECONDS])
            ),
            count: 0,
          },
        },
      ],
    });

    this._sendTokenToUser({ email, otp });

    return successHandler({
      res,
      message: StringConstants.SINGED_UP_SUCCESSFUL_MESSAGE,
    });
  };

  verifyEmail = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { token } = req.query as VerifyEmailQueryDtoType;

      console.log({ token });

      console.log({
        encKey: process.env[EnvFields.EMAIL_VERIFICATION_TOKEN_ENC_KEY],
      });

      const tokenAfterDecryption = EncryptionSecurityUtil.decryptText({
        cipherText: decodeURIComponent(token),
        secretKey: process.env[EnvFields.EMAIL_VERIFICATION_TOKEN_ENC_KEY]!,
      });

      console.log({ tokenAfterDecryption });

      const [email, otp] = tokenAfterDecryption.split(" ");

      const user = await this._userRespository.findOne({
        filter: {
          email,
          confirmEmailLink: { $exists: true },
          freezed: { $exists: false },
          confirmedAt: { $exists: false },
        },
      });

      if (!user) {
        throw new BadRequestException(
          StringConstants.INVALID_EMAIL_ACCOUNT_OR_VARIFIED_MESSAGE
        );
      }

      if (Date.now() >= user.confirmEmailLink!.expiresAt.getTime()) {
        throw new BadRequestException(
          StringConstants.EMAIL_VERIFICATION_LINK_EXPIRE_MESSAGE
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

      return successHtmlHandler({
        res,
        htmlContent: HTML_VERIFY_EMAIL_TEMPLATE({
          logoUrl: process.env[EnvFields.LOGO_URL]!,
        }),
      });
    } catch (error: any) {
      return successHtmlHandler({
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
    res: Response
  ): Promise<Response> => {
    const { email } = req.body as ResendEmailVerificationLinkBodyDtoType;

    const user = await this._userRespository.findOne({
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

  logIn = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body as LogInBodyDtoType;

    const user = await this._userRespository.findOne({
      filter: {
        email,
        freezed: { $exists: false },
        confirmedAt: { $exists: true },
      },
    });

    if (!user) {
      throw new NotFoundException(StringConstants.INVALID_USER_ACCOUNT_MESSAGE);
    }

    if (
      !(await HashingSecurityUtil.compareHash({
        plainText: password,
        cipherText: user.password!,
      }))
    ) {
      throw new BadRequestException(
        StringConstants.INVALID_LOGIN_CREDENTIALS_MESSAGE
      );
    }
    const { accessToken } = TokenSecurityUtil.getTokensBasedOnRole({ user });

    return successHandler<ILogInResponse>({
      res,
      message: StringConstants.LOG_IN_SUCCESSFUL_MESSAGE,
      body: {
        accessToken,
        user,
      },
    });
  };

  forgetPassword = async (req: Request, res: Response): Promise<Response> => {
    const { email } = req.body as ForgetPasswordBodyDtoType;

    const user = await this._userRespository.findOne({
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
            ]
          )
    ) {
      throw new BadRequestException(
        StringConstants.RESET_PASSWORD_RECENTLY_MESSAGE
      );
    }

    const count = OTPSecurityUtil.checkRequestOfNewOTP({
      user,
      otpType: OTPsOrLinksEnum.forgetPasswordOTP,
      checkEmailStatus: EmailStatusEnum.confirmed,
    });

    const otp = IdSecurityUtil.generateNumericId();

    await this._userRespository.updateOne({
      filter: {
        _id: user._id!,
      },
      update: {
        $unset: {
          forgetPasswordVerificationExpiresAt: 1,
        },
        forgetPasswordOtp: {
          code: await HashingSecurityUtil.hashText({ plainText: otp }),
          expiresAt: new Date(
            Date.now() +
              Number(process.env[EnvFields.OTP_EXPIRES_IN_MILLISECONDS])
          ),
          count,
        },
      },
    });

    emailEvent.publish({
      eventName: EventsEnum.forgetPassword,
      payload: { to: email, otpOrLink: otp },
    });

    return successHandler({ res, message: StringConstants.OTP_SENT_MESSAGE });
  };

  verifyForgetPassword = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { email, otp } = req.body as VerifyForgetPasswordBodyDtoType;

    const user = await this._userRespository.findOne({
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

    await this._userRespository.updateOne({
      filter: {
        _id: user._id!,
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
    res: Response
  ): Promise<Response> => {
    const { email, password } = req.body as ResetForgetPasswordBodyDtoType;

    const user = await this._userRespository.findOne({
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
        StringConstants.FORGET_PASSWORD_VERIFICATION_EXPIRE_MESSAGE
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
