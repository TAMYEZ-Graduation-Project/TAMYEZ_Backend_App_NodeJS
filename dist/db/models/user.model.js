import mongoose from "mongoose";
import { GenderEnum, ProvidersEnum, RolesEnum, } from "../../utils/constants/enum.constants.js";
import ModelsNames from "../../utils/constants/models.names.constants.js";
import { softDeleteFunction } from "../../utils/soft_delete/soft_delete.js";
import DocumentFormat from "../../utils/formats/document.format.js";
import { atByObjectSchema, codeExpireCountObjectSchema, idSelectedAtObjectSchema, profilePictureObjectSchema, } from "./common_schemas.model.js";
import HashingSecurityUtil from "../../utils/security/hash.security.js";
import EncryptionSecurityUtil from "../../utils/security/encryption.security.js";
const quizAttemptsSchema = new mongoose.Schema({
    count: { type: Number, required: true, min: 0, max: 5 },
    lastAttempt: { type: Date, required: true },
}, { _id: false });
const userSchema = new mongoose.Schema({
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
        required: function () {
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
        required: function () {
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
        required: function () {
            return this.authProvider === ProvidersEnum.local;
        },
    },
    dateOfBirth: { type: Date },
    profilePicture: {
        type: profilePictureObjectSchema,
    },
    careerPath: { type: idSelectedAtObjectSchema },
    quizAttempts: quizAttemptsSchema,
    freezed: atByObjectSchema,
    restored: atByObjectSchema,
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema
    .virtual("fullName")
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
})
    .set(function (value) {
    const [firstName, lastName] = value.split(" ");
    this.set({ firstName, lastName });
});
userSchema.methods.toJSON = function () {
    const userObject = DocumentFormat.getIdFrom_Id(this.toObject());
    return {
        id: userObject.id,
        fullName: userObject.firstName
            ? `${userObject.firstName} ${userObject.lastName}`
            : undefined,
        email: userObject.email,
        phoneNumber: userObject.phoneNumber,
        gender: userObject.gender,
        role: userObject.role,
        profilePicture: userObject?.profilePicture?.url
            ? DocumentFormat.getFullURLFromSubKey(userObject.profilePicture.url)
            : undefined,
        createdAt: userObject.createdAt,
        updatedAt: userObject.updatedAt,
        confirmedAt: userObject.confirmedAt,
    };
};
userSchema.pre("save", async function (next) {
    if (this.isModified("password") &&
        !HashingSecurityUtil.isHashed({ text: this.password })) {
        this.password = await HashingSecurityUtil.hashText({
            plainText: this.password,
        });
    }
    if (this.isModified("phoneNumber") &&
        !EncryptionSecurityUtil.isEncrypted({ text: this.phoneNumber })) {
        this.phoneNumber = EncryptionSecurityUtil.encryptText({
            plainText: this.phoneNumber,
        });
    }
    next();
});
userSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
    const updateObject = this.getUpdate();
    if (updateObject?.password &&
        !HashingSecurityUtil.isHashed({ text: updateObject.password })) {
        updateObject.password = await HashingSecurityUtil.hashText({
            plainText: updateObject.password,
        });
    }
    if (updateObject?.phoneNumber &&
        !EncryptionSecurityUtil.isEncrypted({ text: updateObject.phoneNumber })) {
        updateObject.phoneNumber = EncryptionSecurityUtil.encryptText({
            plainText: updateObject.phoneNumber,
        });
    }
    this.setUpdate(updateObject);
});
userSchema.pre(["find", "findOne", "findOneAndUpdate", "countDocuments"], function (next) {
    softDeleteFunction(this);
    next();
});
userSchema.post(["find", "findOne", "findOneAndUpdate", "countDocuments"], function (docs, next) {
    if (!docs)
        return next();
    const decryptPhone = (doc) => {
        if (doc.phoneNumber &&
            EncryptionSecurityUtil.isEncrypted({ text: doc.phoneNumber })) {
            doc.phoneNumber = EncryptionSecurityUtil.decryptText({
                cipherText: doc.phoneNumber,
            });
        }
    };
    if (Array.isArray(docs)) {
        docs.forEach(decryptPhone);
    }
    else {
        decryptPhone(docs);
    }
    next();
});
const UserModel = mongoose.models?.User ||
    mongoose.model(ModelsNames.userModel, userSchema);
export default UserModel;
