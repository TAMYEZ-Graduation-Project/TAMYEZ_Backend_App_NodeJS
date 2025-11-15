import mongoose from "mongoose";
import type {
  IOtpOrLinkObject,
  IProfilePicture,
  IUser,
} from "../interfaces/user.interface.ts";
import {
  GenderEnum,
  ProvidersEnum,
  RolesEnum,
} from "../../utils/constants/enum.constants.ts";
import ModelsNames from "../../utils/constants/models.names.ts";

const OtpOrLinkObjectSchema = new mongoose.Schema<IOtpOrLinkObject>(
  {
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    count: { type: Number, required: true },
  },
  { _id: false }
);

const ProfilePictureSchema = new mongoose.Schema<IProfilePicture>(
  {
    url: { type: String, requird: true },
    provider: {
      type: String,
      enum: Object.values(ProvidersEnum),
      default: ProvidersEnum.local,
    },
  },
  { _id: false }
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
      type: OtpOrLinkObjectSchema,
    },

    password: {
      type: String,
      required: function (this: IUser) {
        return this.authProvider === ProvidersEnum.local;
      },
    },
    forgetPasswordOtp: {
      type: OtpOrLinkObjectSchema,
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
      type: ProfilePictureSchema,
    },
    coverImages: [String],

    // Acadamic Info
    education: { type: String },
    skills: { type: [String], default: [] },
    coursesAndCertifications: { type: [String], default: [] },
    careerPathId: { type: mongoose.Schema.Types.ObjectId, ref: "CareerPath" },

    freezed: {
      at: Date,
      by: { type: mongoose.Schema.Types.ObjectId, ref: ModelsNames.userModel },
    },

    restored: {
      at: Date,
      by: { type: mongoose.Schema.Types.ObjectId, ref: ModelsNames.userModel },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
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
  const { id, ...restObj }: IUser = this.toObject();

  return {
    id: this._id,
    fullName: `${restObj.firstName} ${restObj.lastName}`,
    email: restObj.email,
    phoneNumber: restObj.phoneNumber,
    gender: restObj.gender,
    role: restObj.role,
    profilePicture: restObj.profilePicture,
    createdAt: restObj.createdAt,
    updatedAt: restObj.updatedAt,
    confirmedAt: restObj.confirmedAt,
  };
};

const UserModel =
  (mongoose.models?.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>(ModelsNames.userModel, userSchema);

export default UserModel;
