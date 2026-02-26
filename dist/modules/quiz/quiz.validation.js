import { z } from "zod";
import StringConstants from "../../utils/constants/strings.constants.js";
import { OptionIdsEnum, QuestionTypesEnum, QuizTypesEnum, } from "../../utils/constants/enum.constants.js";
import AppRegex from "../../utils/constants/regex.constants.js";
import generalValidationConstants from "../../utils/constants/validation.constants.js";
class QuizValidators {
    static createQuiz = {
        body: z
            .strictObject({
            title: z
                .string()
                .regex(AppRegex.quizTitleRegex, {
                error: "Quiz title must consists of words each start with a capital letter followed by at least a small letter length between 3 and 200 charachters 🔠",
            })
                .optional(),
            description: z
                .string({
                error: StringConstants.PATH_REQUIRED_MESSAGE("description"),
            })
                .min(3)
                .max(50_000),
            aiPrompt: z
                .string({
                error: StringConstants.PATH_REQUIRED_MESSAGE("aiPrompt"),
            })
                .min(3)
                .max(50_000),
            type: z
                .enum(Object.values(QuizTypesEnum), {
                error: StringConstants.INVALID_ENUM_VALUE_MESSAGE({
                    enumValueName: "quiz type",
                    theEnum: QuizTypesEnum,
                }),
            })
                .optional()
                .default(QuizTypesEnum.stepQuiz),
            duration: z
                .number({
                error: StringConstants.INVALID_VALIDATION_DURATION_MESSAGE,
            })
                .int({ error: StringConstants.INVALID_VALIDATION_DURATION_MESSAGE })
                .min(60)
                .max(36_000)
                .optional(),
            tags: z.array(z.string().toLowerCase()).min(2).max(20).optional(),
        })
            .superRefine((data, ctx) => {
            if (data.type !== QuizTypesEnum.careerAssessment &&
                data.title == undefined) {
                ctx.addIssue({
                    code: "custom",
                    path: ["title"],
                    message: StringConstants.PATH_REQUIRED_MESSAGE("title"),
                });
            }
            else if (data.type === QuizTypesEnum.careerAssessment &&
                data.title != undefined) {
                ctx.addIssue({
                    code: "custom",
                    path: ["title"],
                    message: `quiz with type ${QuizTypesEnum.careerAssessment} its title is set by default ⚠️`,
                });
            }
            if (data.type !== QuizTypesEnum.careerAssessment &&
                data.duration == undefined) {
                ctx.addIssue({
                    code: "custom",
                    path: ["duration"],
                    message: StringConstants.PATH_REQUIRED_MESSAGE("duration"),
                });
            }
            else if (data.type === QuizTypesEnum.careerAssessment &&
                data.duration != undefined) {
                ctx.addIssue({
                    code: "custom",
                    path: ["duration"],
                    message: StringConstants.INVALID_DURATION_EXIST_MESSAGE,
                });
            }
            if (data.type !== QuizTypesEnum.careerAssessment &&
                !data.tags?.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: StringConstants.PATH_REQUIRED_MESSAGE("tags"),
                });
            }
            else if (data.type === QuizTypesEnum.careerAssessment &&
                data.tags?.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: `${StringConstants.CAREER_ASSESSMENT} should not have tags`,
                });
            }
        })
            .transform((data) => {
            if (data.type === QuizTypesEnum.careerAssessment &&
                !data.title &&
                !data.tags?.length) {
                return {
                    ...data,
                    title: StringConstants.CAREER_ASSESSMENT,
                    tags: ["initial", "assessment"],
                };
            }
            return data;
        }),
    };
    static updateQuiz = {
        params: z.strictObject({ quizId: generalValidationConstants.objectId }),
        body: z
            .strictObject({
            title: z
                .string()
                .regex(AppRegex.quizTitleRegex, {
                error: "Quiz title must consists of words each start with a capital letter followed by at least a small letter length between 3 and 200 charachters 🔠",
            })
                .optional(),
            description: z
                .string({
                error: StringConstants.PATH_REQUIRED_MESSAGE("description"),
            })
                .min(3)
                .max(50_000)
                .optional(),
            aiPrompt: z
                .string({
                error: StringConstants.PATH_REQUIRED_MESSAGE("aiPrompt"),
            })
                .min(3)
                .max(50_000)
                .optional(),
            type: z
                .enum(Object.values(QuizTypesEnum), {
                error: StringConstants.INVALID_ENUM_VALUE_MESSAGE({
                    enumValueName: "quiz type",
                    theEnum: QuizTypesEnum,
                }),
            })
                .optional(),
            duration: z
                .number({
                error: StringConstants.INVALID_VALIDATION_DURATION_MESSAGE,
            })
                .int({ error: StringConstants.INVALID_VALIDATION_DURATION_MESSAGE })
                .min(60)
                .max(36_000)
                .optional(),
            tags: z.array(z.string().toLowerCase()).min(2).max(20).optional(),
            v: generalValidationConstants.v,
        })
            .superRefine((data, ctx) => {
            generalValidationConstants.checkValuesForUpdate(data, ctx);
            if (data.type === QuizTypesEnum.careerAssessment &&
                data.title != undefined) {
                ctx.addIssue({
                    code: "custom",
                    path: ["title"],
                    message: `quiz with type ${QuizTypesEnum.careerAssessment} its title can not be updated ⚠️`,
                });
            }
            if (data.type === QuizTypesEnum.careerAssessment &&
                data.duration != undefined) {
                ctx.addIssue({
                    code: "custom",
                    path: ["duration"],
                    message: StringConstants.INVALID_DURATION_EXIST_MESSAGE,
                });
            }
            if (data.type === QuizTypesEnum.careerAssessment && data.tags?.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: `${StringConstants.CAREER_ASSESSMENT} should not have tags`,
                });
            }
        }),
    };
    static getQuiz = {
        params: z.strictObject({
            quizId: z.union([
                z.literal(QuizTypesEnum.careerAssessment),
                generalValidationConstants.objectId,
            ]),
            roadmapStepId: generalValidationConstants.objectId.optional(),
        }),
    };
    static getQuizQuestions = {
        params: this.getQuiz.params
            .extend({
            roadmapStepId: generalValidationConstants.objectId.optional(),
        })
            .superRefine((data, ctx) => {
            if (data.quizId !== QuizTypesEnum.careerAssessment &&
                !data.roadmapStepId) {
                ctx.addIssue({
                    code: "custom",
                    path: ["roadmapStepId"],
                    message: "roadmapStepId is required when getting questions of roadmap step quiz ❌",
                });
            }
            else if (data.quizId === QuizTypesEnum.careerAssessment &&
                data.roadmapStepId) {
                ctx.addIssue({
                    code: "custom",
                    path: ["roadmapStepId"],
                    message: `no need for roadmapStepId, when getting ${QuizTypesEnum.careerAssessment} questions ❌`,
                });
            }
        }),
    };
    static getQuizzes = {
        query: z.strictObject({
            size: z.coerce.number().int().min(2).max(30).optional().default(15),
            page: z.coerce.number().int().min(1).max(300).optional().default(1),
            searchKey: z.string().nonempty().min(1).optional(),
        }),
    };
    static checkQuizAnswers = {
        params: z.strictObject({ quizAttemptId: generalValidationConstants.objectId }),
        body: z.strictObject({
            answers: z
                .array(z
                .strictObject({
                questionId: generalValidationConstants.objectId,
                type: z.enum(Object.values(QuestionTypesEnum)),
                answer: z.union([
                    z.string().min(1).max(5_000),
                    z
                        .array(z.enum(Object.values(OptionIdsEnum)))
                        .min(1)
                        .max(5),
                ], { error: "Answer format is invalid ❌" }),
            })
                .superRefine((data, ctx) => {
                if (data.type === QuestionTypesEnum.written) {
                    if (typeof data.answer !== "string") {
                        ctx.addIssue({
                            code: "custom",
                            path: ["answer"],
                            message: `For question type ${QuestionTypesEnum.written}, answer must be a string ❌`,
                        });
                    }
                }
                else {
                    if (!Array.isArray(data.answer) ||
                        data.answer.some((ans) => !Object.values(OptionIdsEnum).includes(ans))) {
                        ctx.addIssue({
                            code: "custom",
                            path: ["answer"],
                            message: `For question types ${QuestionTypesEnum.mcqSingle} Or ${QuestionTypesEnum.mcqMulti}, answer must be an array of otpionIds ${Object.values(OptionIdsEnum)} numbers ❌`,
                        });
                    }
                    else if (data.type === QuestionTypesEnum.mcqSingle &&
                        data.answer.length !== 1) {
                        ctx.addIssue({
                            code: "custom",
                            path: ["answer"],
                            message: `For question type ${QuestionTypesEnum.mcqSingle}, answer must be an array containing exactly one optionId ❌`,
                        });
                    }
                }
            }))
                .min(2)
                .max(200),
        }),
    };
    static getSavedQuizzes = {
        query: z.strictObject({
            page: z.coerce.number().int().min(1).max(100).optional().default(1),
            size: z.coerce.number().int().min(5).max(50).optional().default(10),
        }),
    };
    static getSavedQuiz = {
        params: z.strictObject({
            savedQuizId: generalValidationConstants.objectId,
        }),
    };
    static archiveQuiz = {
        params: this.updateQuiz.params,
        body: z.strictObject({
            v: generalValidationConstants.v,
        }),
    };
    static restoreQuiz = {
        params: this.archiveQuiz.params,
        body: this.archiveQuiz.body,
    };
    static deleteQuiz = {
        params: this.archiveQuiz.params,
        body: this.archiveQuiz.body,
    };
}
export default QuizValidators;
