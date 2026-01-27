import mongoose from "mongoose";
import type { IQuizAttempts, IUser } from "../interfaces/user.interface.ts";
import {
  GenderEnum,
  ProvidersEnum,
  RolesEnum,
} from "../../utils/constants/enum.constants.ts";
import ModelsNames from "../../utils/constants/models.names.constants.ts";
import { softDeleteFunction } from "../../utils/soft_delete/soft_delete.ts";
import DocumentFormat from "../../utils/formats/document.format.ts";
import {
  atByObjectSchema,
  codeExpireCountObjectSchema,
  idSelectedAtObjectSchema,
  profilePictureObjectSchema,
} from "./common_schemas.model.ts";
import HashingSecurityUtil from "../../utils/security/hash.security.ts";
import EncryptionSecurityUtil from "../../utils/security/encryption.security.ts";
import type { UpdateQuery } from "mongoose";
import S3KeyUtil from "../../utils/multer/s3_key.multer.ts";

const quizAttemptsSchema = new mongoose.Schema<IQuizAttempts>(
  {
    count: { type: Number, required: true, min: 0, max: 5 },
    lastAttempt: { type: Date, required: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: { type: String, required: true, minlength: 2, maxlength: 25 },
    lastName: { type: String, required: true, minlength: 2, maxlength: 25 },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    confirmedAt: { type: Date },
    confirmEmailLink: {
      type: codeExpireCountObjectSchema,
    },

    password: {
      type: String,
      required: function (this: IUser) {
        return this.authProvider === ProvidersEnum.local;
      },
    },
    forgetPasswordOtp: {
      type: codeExpireCountObjectSchema,
    },
    forgetPasswordVerificationExpiresAt: { type: Date },
    lastResetPasswordAt: { type: Date },

    changeCredentialsTime: { type: Date },

    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      required: function (this: IUser) {
        return this.authProvider === ProvidersEnum.local;
      },
    },

    role: {
      type: String,
      enum: Object.values(RolesEnum),
      default: RolesEnum.user,
    },

    authProvider: {
      type: String,
      enum: Object.values(ProvidersEnum),
      default: ProvidersEnum.local,
    },

    phoneNumber: {
      type: String,
      required: function (this: IUser) {
        return this.authProvider === ProvidersEnum.local;
      },
    },

    dateOfBirth: { type: Date },

    profilePicture: {
      type: profilePictureObjectSchema,
    },

    // Acadamic Info
    careerPath: {
      type: idSelectedAtObjectSchema({ ref: ModelsNames.careerModel }),
    },

    // Quiz Info
    quizAttempts: quizAttemptsSchema,

    freezed: atByObjectSchema,

    restored: atByObjectSchema,
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.index(
  { "careerPath.id": 1 },
  { partialFilterExpression: { "careerPath.id": { $exists: true } } },
);

userSchema
  .virtual("fullName")
  .get(function (this: IUser) {
    return `${this.firstName} ${this.lastName}`;
  })
  .set(function (value: string) {
    const [firstName, lastName] = value.split(" ");
    this.set({ firstName, lastName });
  });

userSchema.methods.toJSON = function () {
  const userObject = DocumentFormat.getIdFrom_Id<IUser>(this.toObject());

  return {
    id: userObject?.id,
    fullName: userObject?.firstName
      ? `${userObject.firstName} ${userObject.lastName}`
      : undefined,
    email: userObject?.email,
    phoneNumber: userObject?.phoneNumber,
    gender: userObject?.gender,
    role: userObject?.role,
    profilePicture: userObject?.profilePicture?.url
      ? userObject.profilePicture.provider === ProvidersEnum.local
        ? S3KeyUtil.generateS3UploadsUrlFromSubKey(
            userObject.profilePicture.url,
          )
        : userObject.profilePicture.url
      : undefined,
    careerPath: userObject?.careerPath,
    createdAt: userObject?.createdAt,
    updatedAt: userObject?.updatedAt,
    confirmedAt: userObject?.confirmedAt,
    v: userObject?.v,
  };
};

userSchema.pre("save", async function (next) {
  if (
    this.isModified("password") &&
    !HashingSecurityUtil.isHashed({ text: this.password })
  ) {
    this.password = await HashingSecurityUtil.hashText({
      plainText: this.password,
    });
  }

  if (
    this.isModified("phoneNumber") &&
    !EncryptionSecurityUtil.isEncrypted({ text: this.phoneNumber })
  ) {
    this.phoneNumber = EncryptionSecurityUtil.encryptText({
      plainText: this.phoneNumber,
    });
  }
  next();
});

userSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
  const updateObject = this.getUpdate() as UpdateQuery<IUser>;

  if (
    updateObject?.password &&
    !HashingSecurityUtil.isHashed({ text: updateObject.password })
  ) {
    updateObject.password = await HashingSecurityUtil.hashText({
      plainText: updateObject.password,
    });
  }

  if (
    updateObject?.phoneNumber &&
    !EncryptionSecurityUtil.isEncrypted({ text: updateObject.phoneNumber })
  ) {
    updateObject.phoneNumber = EncryptionSecurityUtil.encryptText({
      plainText: updateObject.phoneNumber,
    });
  }

  this.setUpdate(updateObject); // ✅ Correct method
});

userSchema.pre(
  ["find", "findOne", "updateOne", "findOneAndUpdate", "countDocuments"],
  function (next) {
    softDeleteFunction(this);

    next();
  },
);

userSchema.post(
  ["find", "findOne", "updateOne", "findOneAndUpdate", "countDocuments"],
  function (this, docs, next) {
    // docs is an array for 'find', or a single document for 'findOne'

    if (!docs) return next();

    const decryptPhone = (doc: any) => {
      if (
        doc.phoneNumber &&
        EncryptionSecurityUtil.isEncrypted({ text: doc.phoneNumber })
      ) {
        doc.phoneNumber = EncryptionSecurityUtil.decryptText({
          cipherText: doc.phoneNumber,
        });
      }
    };

    if (Array.isArray(docs)) {
      docs.forEach(decryptPhone);
    } else {
      decryptPhone(docs);
    }

    next();
  },
);

const UserModel =
  (mongoose.models?.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>(ModelsNames.userModel, userSchema);

export default UserModel;
