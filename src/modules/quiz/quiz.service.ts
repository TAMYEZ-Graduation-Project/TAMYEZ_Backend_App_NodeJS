import type { Request, Response } from "express";
import {
  QuizCooldownModel,
  QuizModel,
  QuizAttemptModel,
  SavedQuizModel,
  RoadmapStepModel,
} from "../../db/models/index.ts";
import {
  QuizAttemptRepository,
  QuizRepository,
  RoadmapStepRepository,
} from "../../db/repositories/index.ts";
import successHandler from "../../utils/handlers/success.handler.ts";
import type {
  ArchiveQuizBodyDtoType,
  ArchiveQuizParamsDtoType,
  CheckQuizAnswersBodyDtoType,
  CheckQuizAnswersParamsDtoType,
  CreateQuizBodyDtoType,
  DeleteQuizBodyDtoType,
  DeleteQuizParamsDtoType,
  GetQuizParamsDtoType,
  GetQuizQuestionsParamsDtoType,
  GetQuizzesQueryDtoType,
  GetSavedQuizParamsDtoType,
  GetSavedQuizzesQueryDtoType,
  RestoreQuizBodyDtoType,
  RestoreQuizParamsDtoType,
  UpdateQuizBodyDtoType,
  UpdateQuizParamsDtoType,
} from "./quiz.dto.ts";
import {
  OptionIdsEnum,
  QuestionTypesEnum,
  QuizTypesEnum,
  RolesEnum,
} from "../../utils/constants/enum.constants.ts";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServerException,
  TooManyRequestsException,
  ValidationException,
} from "../../utils/exceptions/custom.exceptions.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";
import QuizUtil from "../../utils/quiz/utils.quiz.ts";
import UpdateUtil from "../../utils/update/util.update.ts";
import type { HIQuiz } from "../../db/interfaces/quiz.interface.ts";
import type {
  IGetQuizDetailsResponse,
  IGetQuizQuestionsResponse,
} from "./quiz.entity.ts";
import EnvFields from "../../utils/constants/env_fields.constants.ts";
import type {
  IAIModelCheckWrittenQuestionsRequest,
  IAIModelCheckWrittenQuestionsResponse,
  IAIModelGeneratedQuestionsRequest,
  IAIModelGeneratedQuestionsResponse,
} from "../../utils/constants/interface.constants.ts";
import makeCompleter from "../../utils/completer/make.completer.ts";
import type {
  FullIQuestion,
  HIQuestion,
  IQuestion,
} from "../../db/interfaces/quiz_questions.interface.ts";
import SavedQuizRepository from "../../db/repositories/saved_quiz.repository.ts";
import type { ISavedQuestion } from "../../db/interfaces/saved_quiz.interface.ts";
import QuizCooldownRepository from "../../db/repositories/quiz_cooldown.repository.ts";
import pause from "../../utils/pause/code.pause.ts";
import type { Types } from "mongoose";

class QuizService {
  private _quizRepository = new QuizRepository(QuizModel);
  private _quizAttemptRepository = new QuizAttemptRepository(QuizAttemptModel);
  private _savedQuizRepository = new SavedQuizRepository(SavedQuizModel);
  private _quizCooldownRepository = new QuizCooldownRepository(
    QuizCooldownModel,
  );
  private readonly _roadmapStepRepository = new RoadmapStepRepository(
    RoadmapStepModel,
  );
  //private _quizApisManager = new QuizApisManager();

  createQuiz = async (req: Request, res: Response): Promise<Response> => {
    const { title, description, aiPrompt, type, duration, tags } = req
      .validationResult.body as CreateQuizBodyDtoType;

    if (type === QuizTypesEnum.careerAssessment) {
      if (await this._quizRepository.findOne({ filter: { type } })) {
        throw new ConflictException(
          `Quiz of type ${QuizTypesEnum.careerAssessment} already exists 🚫`,
        );
      }
    } else {
      if (
        !(await this._quizRepository.findOne({
          filter: { type: QuizTypesEnum.careerAssessment },
        }))
      ) {
        throw new BadRequestException(
          `Before creating any step quiz ${StringConstants.CAREER_ASSESSMENT} must have been created 🚫`,
        );
      }
    }

    const uniqueKey = QuizUtil.getQuizUniqueKey({
      title: title!,
      tags: tags!,
    });

    if (
      await this._quizRepository.findOne({
        filter: { uniqueKey },
      })
    ) {
      throw new ConflictException(
        "A quiz with the same title and tags already exists ❌",
      );
    }

    await this._quizRepository.create({
      data: [
        {
          uniqueKey,
          title: title!,
          description,
          aiPrompt,
          type,
          duration,
          tags,
          createdBy: req.user!._id!,
        },
      ],
    });

    return successHandler({
      res,
      message: StringConstants.CREATED_SUCCESSFULLY_MESSAGE("Quiz"),
    });
  };

  updateQuiz = async (req: Request, res: Response): Promise<Response> => {
    const { quizId } = req.params as UpdateQuizParamsDtoType;
    const { title, description, aiPrompt, type, duration, tags, v } = req
      .validationResult.body as UpdateQuizBodyDtoType;

    const quiz = await this._quizRepository.findOne({
      filter: { _id: quizId, paranoid: false },
    });

    if (!quiz) {
      throw new NotFoundException(
        StringConstants.INVALID_PARAMETER_MESSAGE("quizId"),
      );
    }

    const uniqueKey = QuizUtil.getQuizUniqueKey({
      title: title || quiz.title,
      tags: tags || quiz.tags!,
    });

    if (
      quiz.type === QuizTypesEnum.careerAssessment &&
      (type || duration || tags?.length)
    ) {
      throw new ValidationException(
        `Only description and aiPrompt of ${StringConstants.CAREER_ASSESSMENT} can be updated 🔒`,
      );
    } else {
      if (type === QuizTypesEnum.careerAssessment) {
        throw new BadRequestException(
          `${QuizTypesEnum.stepQuiz} can not be update to ${QuizTypesEnum.careerAssessment} 🔒`,
        );
      }
      if (title || tags) {
        if (
          await this._quizRepository.findOne({
            filter: { uniqueKey },
          })
        ) {
          throw new ConflictException(
            "A quiz with the same title and tags already exists ❌",
          );
        }
      }
    }

    const updateObject = UpdateUtil.getChangedFields<HIQuiz>({
      document: quiz,
      updatedObject: { title, description, aiPrompt, type, duration, tags },
    });

    await this._quizRepository.updateOne({
      filter: { _id: quizId, __v: v },
      update: {
        uniqueKey:
          updateObject.title || updateObject.tags?.length
            ? uniqueKey
            : undefined,
        ...updateObject,
      },
    });

    return successHandler({
      res,
      message: StringConstants.CREATED_SUCCESSFULLY_MESSAGE("Quiz"),
    });
  };

  getQuizzes = ({ archived = false }: { archived?: boolean } = {}) => {
    return async (req: Request, res: Response): Promise<Response> => {
      const { page, size, searchKey } = req.validationResult
        .query as GetQuizzesQueryDtoType;
      const result = await this._quizRepository.paginate({
        filter: {
          ...(searchKey
            ? {
                $or: [
                  { title: { $regex: searchKey, $options: "i" } },
                  {
                    description: { $regex: searchKey, $options: "i" },
                  },
                  {
                    uniqueKey: { $regex: searchKey, $options: "i" },
                  },
                ],
              }
            : {}),
          ...(archived ? { paranoid: false, freezed: { $exists: true } } : {}),
        },
        page,
        size,
        // options: {
        //   projection: {
        //     aiPrompt: 0,
        //     uniqueKey: 0,
        //   },
        // },
      });

      if (!result.data || result.data.length == 0) {
        throw new NotFoundException(
          archived ? "No archived quizzes found 🔍❌" : "No quizzes found 🔍❌",
        );
      }

      return successHandler({ res, body: result });
    };
  };

  getQuiz = ({ archived = false }: { archived?: boolean } = {}) => {
    return async (req: Request, res: Response): Promise<Response> => {
      const { quizId, roadmapStepId } = req.params as GetQuizParamsDtoType;

      // when role == user than ofcourse archived is false
      if (req.user!.role === RolesEnum.user) {
        if (quizId === QuizTypesEnum.careerAssessment) {
          if (req.user?.careerPath)
            throw new BadRequestException(
              "This account already has a career path, you can't retake the career assessment ❌",
            );
        } else {
          if (!req.user!.careerPath)
            throw new BadRequestException(
              "You have to select a career path before getting a roadmap step quiz ❌",
            );
          if (!roadmapStepId)
            throw new BadRequestException("roadmapStepId is required ❌");

          if (
            !(
              await this._roadmapStepRepository.findOne({
                filter: {
                  _id: roadmapStepId,
                  careerId: req.user!.careerPath.id,
                  quizzesIds: { $in: [quizId] },
                },
                options: {
                  populate: [{ path: "careerId", select: { _id: 1 } }],
                },
              })
            )?.careerId
          ) {
            throw new BadRequestException(
              "Invalid roadmapStepId, not in your career path or invalid quizId ❌",
            );
          }
        }
      }

      const quiz = await this._quizRepository.findOne({
        filter: {
          ...(quizId === QuizTypesEnum.careerAssessment
            ? {
                uniqueKey: {
                  $regex: StringConstants.CAREER_ASSESSMENT,
                  $options: "i",
                },
              }
            : { _id: quizId }),
          ...(archived ? { paranoid: false, freezed: { $exists: true } } : {}),
        },
        projection:
          req.user!.role === RolesEnum.user
            ? {
                aiPrompt: 0,
                uniqueKey: 0,
              }
            : {},
      });

      if (!quiz) {
        throw new NotFoundException(
          archived ? "No archived quiz found 🔍❌" : "No quiz found 🔍❌",
        );
      }

      return successHandler<IGetQuizDetailsResponse>({ res, body: { quiz } });
    };
  };

  private _generateQuestions = async ({
    title,
    aiPrompt,
  }: IAIModelGeneratedQuestionsRequest): Promise<IAIModelGeneratedQuestionsResponse> => {
    await pause(1500);
    return {
      questions: [
        {
          type: "mcq-single" as QuestionTypesEnum,
          text: "Which data structure uses LIFO (Last In, First Out) principle?",
          options: [
            { id: "optA" as OptionIdsEnum, text: "Queue" },
            { id: "optB" as OptionIdsEnum, text: "Stack" },
            { id: "optC" as OptionIdsEnum, text: "Array" },
            { id: "optD" as OptionIdsEnum, text: "Linked List" },
          ],
          correctAnswer: ["optB" as OptionIdsEnum],
          explanation:
            "A stack follows the LIFO principle, meaning the last element added is the first to be removed.",
        },
        {
          type: "mcq-single" as QuestionTypesEnum,
          text: "What is the time complexity of binary search in a sorted array?",
          options: [
            { id: "optA" as OptionIdsEnum, text: "O(n)" },
            { id: "optB" as OptionIdsEnum, text: "O(log n)" },
            { id: "optC" as OptionIdsEnum, text: "O(n log n)" },
            { id: "optD" as OptionIdsEnum, text: "O(1)" },
          ],
          correctAnswer: ["optB" as OptionIdsEnum],
          explanation:
            "Binary search halves the search space each time, resulting in logarithmic complexity O(log n).",
        },
        {
          type: "mcq-multi" as QuestionTypesEnum,
          text: "Which of the following are programming paradigms?",
          options: [
            { id: "optA" as OptionIdsEnum, text: "Object-Oriented" },
            { id: "optB" as OptionIdsEnum, text: "Functional" },
            { id: "optC" as OptionIdsEnum, text: "Procedural" },
            { id: "optD" as OptionIdsEnum, text: "Relational" },
          ],
          correctAnswer: [
            "optA" as OptionIdsEnum,
            "optB" as OptionIdsEnum,
            "optC" as OptionIdsEnum,
          ],
          explanation:
            "Object-Oriented, Functional, and Procedural are paradigms; Relational refers to databases, not a paradigm.",
        },
        {
          type: "written" as QuestionTypesEnum,
          text: "Explain the difference between TCP and UDP.",
        },
        {
          type: "mcq-single" as QuestionTypesEnum,
          text: "Which algorithm is commonly used for shortest path in a graph?",
          options: [
            { id: "optA" as OptionIdsEnum, text: "Dijkstra's Algorithm" },
            { id: "optB" as OptionIdsEnum, text: "Merge Sort" },
            { id: "optC" as OptionIdsEnum, text: "DFS" },
            { id: "optD" as OptionIdsEnum, text: "Bellman-Ford" },
          ],
          correctAnswer: ["optA" as OptionIdsEnum],
          explanation:
            "Dijkstra's algorithm efficiently finds the shortest path from a source to all other nodes in a weighted graph.",
        },
        {
          type: "mcq-single" as QuestionTypesEnum,
          text: "What does SQL stand for?",
          options: [
            { id: "optA" as OptionIdsEnum, text: "Structured Query Language" },
            { id: "optB" as OptionIdsEnum, text: "Simple Query Language" },
            { id: "optC" as OptionIdsEnum, text: "Sequential Query Language" },
            { id: "optD" as OptionIdsEnum, text: "Standard Query Language" },
          ],
          correctAnswer: ["optA" as OptionIdsEnum],
          explanation:
            "SQL stands for Structured Query Language, used for managing and querying relational databases.",
        },
        {
          type: "mcq-multi" as QuestionTypesEnum,
          text: "Which of the following are NoSQL databases?",
          options: [
            { id: "optA" as OptionIdsEnum, text: "MongoDB" },
            { id: "optB" as OptionIdsEnum, text: "PostgreSQL" },
            { id: "optC" as OptionIdsEnum, text: "Cassandra" },
            { id: "optD" as OptionIdsEnum, text: "Redis" },
          ],
          correctAnswer: ["optA", "optC", "optD"] as OptionIdsEnum[],
          explanation:
            "MongoDB, Cassandra, and Redis are NoSQL databases; PostgreSQL is a relational database.",
        },
        {
          type: "written" as QuestionTypesEnum,
          text: "Describe the concept of polymorphism in object-oriented programming.",
        },
        {
          type: "mcq-single" as QuestionTypesEnum,
          text: "Which of these is NOT a valid HTTP method?",
          options: [
            { id: "optA" as OptionIdsEnum, text: "GET" },
            { id: "optB" as OptionIdsEnum, text: "POST" },
            { id: "optC" as OptionIdsEnum, text: "FETCH" },
            { id: "optD" as OptionIdsEnum, text: "DELETE" },
          ],
          correctAnswer: ["optC" as OptionIdsEnum],
          explanation:
            "GET, POST, and DELETE are valid HTTP methods; FETCH is not an HTTP method but a JavaScript API.",
        },
        {
          type: "written" as QuestionTypesEnum,
          text: "What is the difference between supervised and unsupervised learning in machine learning?",
        },
      ],
    };
  };

  getQuizQuestions = async (req: Request, res: Response): Promise<Response> => {
    const { quizId, roadmapStepId } =
      req.params as GetQuizQuestionsParamsDtoType;

    const filter: { _id?: string; uniqueKey?: Record<any, any> } = {};
    if (quizId === QuizTypesEnum.careerAssessment) {
      if (req.user?.careerPath) {
        throw new BadRequestException(
          "This account already has a career path, you can't retake the career assessment ❌",
        );
      }
      filter.uniqueKey = {
        $regex: StringConstants.CAREER_ASSESSMENT,
        $options: "i",
      };
    } else {
      if (!req.user?.careerPath) {
        throw new BadRequestException(
          "You have to select a career path before taking an roadmap step quizzes ❌",
        );
      }
      filter._id = quizId;
    }

    const quiz = await this._quizRepository.findOne({
      filter: {
        ...filter,
      },
    });

    if (!quiz) {
      throw new NotFoundException(
        StringConstants.INVALID_PARAMETER_MESSAGE("quizId"),
      );
    }

    if (quizId !== QuizTypesEnum.careerAssessment) {
      const roadmapStep = await this._roadmapStepRepository.findOne({
        filter: {
          _id: roadmapStepId,
          careerId: req.user?.careerPath?.id!,
          quizzesIds: { $in: [quizId] },
        },
        options: {
          populate: [{ path: "careerId" }],
        },
      });

      if (!roadmapStep || !roadmapStep.careerId) {
        throw new NotFoundException(
          "Invalid roadmapStepId, career freezed or quiz is not in your roadmap step ❌",
        );
      }
    }

    if (req.user!.quizAttempts?.lastAttempt) {
      if (
        req.user!.quizAttempts.count >= 5 &&
        Date.now() - req.user!.quizAttempts.lastAttempt.getTime() <=
          15 * 60 * 1000
      ) {
        throw new TooManyRequestsException(
          "Too many request, please wait 15 minutes from your last quiz attempt ⏳",
        );
      } else if (
        Date.now() - req.user!.quizAttempts.lastAttempt.getTime() <=
        5 * 60 * 1000
      ) {
        req.user!.quizAttempts.count++;
      } else {
        req.user!.quizAttempts.count = 0;
      }
    }

    if (
      quizId !== QuizTypesEnum.careerAssessment &&
      (await this._quizCooldownRepository.findOne({
        filter: { quizId: quiz._id, userId: req.user!._id! },
      }))
    ) {
      throw new BadRequestException(
        `You are in cooldown period for this quiz. Please try again later ❌`,
      );
    }

    // TODO: before deleting the old quiz attempt, we alert the user that they have an ongoing attempt and ask them if they want to discard it and start a new one
    const [_, generatedQuestions] = await Promise.all([
      this._quizAttemptRepository.deleteOne({
        filter: { quizId: quiz._id, userId: req.user!._id! },
      }),
      this._generateQuestions({
        title: quiz.title,
        aiPrompt: quiz.aiPrompt,
      }),
    ]);

    // await this._quizApisManager.getQuizQustions({
    //   title: quiz.title,
    //   aiPrompt: quiz.aiPrompt,
    // });

    let [quizAttempt] = await this._quizAttemptRepository.create({
      data: [
        {
          quizId: quiz._id,
          userId: req.user!._id!,
          attemptType:
            quizId === QuizTypesEnum.careerAssessment ||
            quiz.title == StringConstants.CAREER_ASSESSMENT
              ? QuizTypesEnum.careerAssessment
              : QuizTypesEnum.stepQuiz,
          careerId: req.user?.careerPath?.id,
          roadmapStepId: roadmapStepId as unknown as Types.ObjectId | undefined,
          questions: generatedQuestions.questions,
          expiresAt: new Date(
            Date.now() +
              (quizId === QuizTypesEnum.careerAssessment ||
              quiz.title == StringConstants.CAREER_ASSESSMENT
                ? Number(
                    process.env[
                      EnvFields.CAREER_ASSESSMENT_QUESTIONS_EXPIRES_IN_SECONDS
                    ],
                  )
                : quiz.duration! +
                  Number(
                    process.env[EnvFields.QUIZ_QUESTIONS_EXPIRES_IN_SECONDS],
                  )) *
                1000,
          ),
        },
      ],
    });

    if (!quizAttempt) {
      throw new ServerException("Failed to generate quiz questions ❓");
    }

    if (!req.user!.quizAttempts?.count) {
      req.user!.quizAttempts = { count: 0, lastAttempt: new Date() };
    }
    await req.user?.save();

    // const quizQuestionsObj = quizQuestions.toJSON();
    // if (quizId === QuizTypesEnum.careerAssessment) {
    //   delete quizQuestionsObj.id;
    // }

    return successHandler<IGetQuizQuestionsResponse>({
      res,
      body: {
        quizAttempt,
      },
    });
  };

  private _checkWrittenQuestionsAnswers = async ({
    resolve,
    title,
    aiPrompt,
    writtenAnswers,
  }: IAIModelCheckWrittenQuestionsRequest & {
    resolve: (data: IAIModelCheckWrittenQuestionsResponse[]) => void;
  }): Promise<IAIModelCheckWrittenQuestionsResponse[]> => {
    return new Promise((res) => {
      setTimeout(() => {
        const response = [];
        for (const answer of writtenAnswers) {
          if (answer.userAnswer.includes("correct")) {
            response.push({
              questionId: answer.questionId,
              isCorrect: true,
            });
          } else {
            response.push({
              questionId: answer.questionId,
              isCorrect: false,
              correction: "This is the correction of user answer",
              explenation: "This is the explanation of user answer",
            });
          }
        }
        resolve(response);
      }, 1500);
    });
  };

  checkQuizAnswers = async (req: Request, res: Response): Promise<Response> => {
    const { quizAttemptId } = req.params as CheckQuizAnswersParamsDtoType;
    const { answers } = req.validationResult
      .body as CheckQuizAnswersBodyDtoType;

    const quizAttempt = await this._quizAttemptRepository.findOne({
      filter: { _id: quizAttemptId, userId: req.user!._id! },
      options: {
        populate: [
          {
            path: "quizId",
            match: { paranoid: false },
            select: "title aiPrompt",
          },
        ],
      },
    });

    if (!quizAttempt) {
      throw new NotFoundException(
        "Quiz questions not found for the given quizAttemptId and user 🚫",
      );
    }

    if (
      (quizAttempt.quizId as unknown as HIQuiz).title ===
      StringConstants.CAREER_ASSESSMENT
    ) {
      throw new BadRequestException(
        `Answers of ${StringConstants.CAREER_ASSESSMENT} quiz, use check career assessment API 🚫`,
      );
    }

    if (answers.length !== quizAttempt.questions.length) {
      throw new ValidationException(
        "Number of answers provided does not match number of questions ❌",
      );
    }

    // ---- Build maps once (O(n)) ----
    const questions = quizAttempt.questions as HIQuestion[];
    const qById = new Map<string, { index: number } & FullIQuestion>();
    for (let i = 0; i < questions.length; i++) {
      const qid = questions[i]!.id?.toString()!;
      qById.set(qid, { index: i, ...questions[i]?.toObject()! } as {
        index: number;
      } & HIQuestion);
    }

    const writtenAnswers: IAIModelCheckWrittenQuestionsRequest["writtenAnswers"] =
      [];
    for (const answer of answers) {
      const question = qById.get(answer.questionId);

      if (!question) {
        throw new NotFoundException(
          `Not found questionId in the quiz questions ${answer.questionId} ❌`,
        );
      } else if (question.type !== answer.type) {
        throw new ValidationException(
          `Question type mismatch for questionId ${answer.questionId} ❌`,
        );
      }
      if (answer.type === QuestionTypesEnum.written) {
        writtenAnswers.push({
          questionId: answer.questionId,
          text: question.text!,
          userAnswer: answer.answer as string,
        });
      }
    }

    // send written questions to AI model for checking
    const gate = makeCompleter();
    this._checkWrittenQuestionsAnswers({
      resolve: gate.resolve as unknown as () => void,
      title: (quizAttempt.quizId as unknown as HIQuiz).title,
      aiPrompt: (quizAttempt.quizId as unknown as HIQuiz).aiPrompt!,
      writtenAnswers,
    });

    const checkedAnswers: ISavedQuestion[] = [];
    let wrongAnswersCount = 0;
    // check non-written questions answers
    for (const answer of answers) {
      const question = qById.get(answer.questionId)! as IQuestion;

      if (question.type === QuestionTypesEnum.written) continue;

      const selectedAnswer = answer.answer;

      const { correctAnswer, explanation, ...rest } = question;
      if (selectedAnswer.toString() == question.correctAnswer?.toString()) {
        checkedAnswers.push({
          ...rest,
          isCorrect: true,
          userAnswer: selectedAnswer,
        });
      } else {
        wrongAnswersCount++;
        checkedAnswers.push({
          ...rest,
          isCorrect: false,
          userAnswer: selectedAnswer,
          correction: correctAnswer,
          explanation,
        });
      }
    }

    const writtenAnswersResults =
      (await gate.promise) as IAIModelCheckWrittenQuestionsResponse[];

    // integrate written answers results
    for (const writtenAnswerResult of writtenAnswersResults) {
      const question = qById.get(writtenAnswerResult.questionId)!;
      if (writtenAnswerResult.isCorrect) {
        checkedAnswers.splice(question.index!, 0, {
          ...question,
          isCorrect: true,
          userAnswer: writtenAnswers.find(
            (wa) => wa.questionId === writtenAnswerResult.questionId,
          )!.userAnswer,
        });
      } else {
        wrongAnswersCount++;
        checkedAnswers.splice(question.index!, 0, {
          ...question,
          isCorrect: false,
          userAnswer: writtenAnswers.find(
            (wa) => wa.questionId === writtenAnswerResult.questionId,
          )!.userAnswer,
          correction: writtenAnswerResult.correction!,
          explanation: writtenAnswerResult.explenation!,
        });
      }
    }

    // saving the checked answers
    const scoreNumber = Math.round(
      ((checkedAnswers.length - wrongAnswersCount) / checkedAnswers.length) *
        100,
    );

    if (scoreNumber >= 50) {
      if (
        !(await this._savedQuizRepository.findOneAndUpdate({
          filter: {
            quizId: quizAttempt.quizId!._id!,
            userId: req.user!._id!,
            __v: undefined,
          },
          update: {
            questions: checkedAnswers,
            score: `${scoreNumber}%`,
            takenAt: new Date(),
          },
        }))
      ) {
        await this._savedQuizRepository.create({
          data: [
            {
              quizId: quizAttempt.quizId!._id!,
              userId: req.user!._id!,
              careerId: quizAttempt.careerId,
              roadmapStepId: quizAttempt.roadmapStepId,
              questions: checkedAnswers,
              score: `${scoreNumber}%`,
              takenAt: new Date(),
            },
          ],
        });
      }
    } else {
      await Promise.all([
        this._savedQuizRepository.deleteOne({
          filter: {
            quizId: quizAttempt.quizId!._id!,
            userId: req.user!._id!,
            __v: undefined,
          },
        }),
        this._quizCooldownRepository.create({
          data: [
            {
              quizId: quizAttempt.quizId!._id!,
              userId: req.user!._id!,
              cooldownEndsAt: new Date(
                Date.now() +
                  Number(process.env[EnvFields.QUIZ_COOLDOWN_IN_SECONDS]) *
                    1000,
              ),
            },
          ],
        }),
      ]);
    }

    await quizAttempt.deleteOne();
    return successHandler({
      res,
      message: "Quiz answers checked successfully ✅",
      body: {
        totalQuestions: checkedAnswers.length,
        wrongAnswersCount,
        correctAnswersCount: checkedAnswers.length - wrongAnswersCount,
        score: `${scoreNumber}%`,
        //answers: checkedAnswers,
      },
    });
  };

  getSavedQuizzes = async (req: Request, res: Response): Promise<Response> => {
    const { page, size } = req.validationResult
      .query as GetSavedQuizzesQueryDtoType;

    const savedQuizzes = await this._savedQuizRepository.paginate({
      filter: { userId: req.user!._id! },
      options: {
        populate: [
          {
            path: "quizId",
            match: { paranoid: false },
            select: "title type duration",
          },
        ],
      },
      projection: { quizId: 1, score: 1, takenAt: 1 },
      page,
      size,
    });

    if (!savedQuizzes.data?.length) {
      throw new NotFoundException("No saved quizzes found 🚫");
    }

    return successHandler({
      res,
      message: "Saved quizzes fetched successfully ✅",
      body: { savedQuizzes },
    });
  };

  getSavedQuiz = async (req: Request, res: Response): Promise<Response> => {
    const { savedQuizId } = req.params as GetSavedQuizParamsDtoType;

    const savedQuiz = await this._savedQuizRepository.findOne({
      filter: { _id: savedQuizId, userId: req.user!._id! },
      options: {
        populate: [
          {
            path: "quizId",
            match: { paranoid: false },
            select: "title type duration",
          },
        ],
      },
    });

    if (!savedQuiz) {
      throw new NotFoundException("Saved quiz not found 🚫");
    }

    return successHandler({
      res,
      message: "Saved quiz fetched successfully ✅",
      body: { savedQuiz },
    });
  };

  archiveQuiz = async (req: Request, res: Response): Promise<Response> => {
    const { quizId } = req.params as ArchiveQuizParamsDtoType;
    const { v } = req.body as ArchiveQuizBodyDtoType;

    const quiz = await this._quizRepository.findOne({
      filter: { _id: quizId, __v: v },
    });
    if (!quiz) {
      throw new NotFoundException("Invalid quizId or already freezed ❌");
    }

    if (quiz.title === StringConstants.CAREER_ASSESSMENT) {
      throw new ForbiddenException(
        `${StringConstants.CAREER_ASSESSMENT} cannot be freezed, it only gets updated ❌`,
      );
    }

    if (
      await this._roadmapStepRepository.exists({
        filter: { quizzesIds: { $in: [quizId] } },
      })
    ) {
      throw new BadRequestException(
        "Can't freeze this quiz because it's used on some roadmap steps ❌",
      );
    }

    await this._quizRepository.updateOne({
      filter: { _id: quizId, __v: v },
      update: {
        freezed: { at: new Date(), by: req.user!._id },
        $unset: { restored: 1 },
      },
    });

    return successHandler({ res });
  };

  restoreQuiz = async (req: Request, res: Response): Promise<Response> => {
    const { quizId } = req.params as RestoreQuizParamsDtoType;
    const { v } = req.body as RestoreQuizBodyDtoType;

    const result = await this._quizRepository.updateOne({
      filter: {
        _id: quizId,
        __v: v,
        paranoid: false,
        freezed: { $exists: true },
      },
      update: {
        restored: { at: new Date(), by: req.user!._id },
        $unset: { freezed: 1 },
      },
    });

    if (!result.matchedCount) {
      throw new NotFoundException("Invalid quizId or Not freezed ❌");
    }

    return successHandler({ res });
  };

  deleteQuiz = async (req: Request, res: Response): Promise<Response> => {
    const { quizId } = req.params as DeleteQuizParamsDtoType;
    const { v } = req.body as DeleteQuizBodyDtoType;

    const quiz = await this._quizRepository.findOne({
      filter: {
        _id: quizId,
        __v: v,
        paranoid: false,
        freezed: { $exists: true },
      },
    });

    if (!quiz) {
      throw new NotFoundException("Invalid quizId or Not freezed ❌");
    }

    if (await this._quizAttemptRepository.exists({ filter: { quizId } })) {
      throw new BadRequestException(
        "There are active quiz attempts on this roadmap step please wait until it's done ❌⌛️",
      );
    }

    if (
      (
        await this._quizRepository.deleteOne({
          filter: {
            _id: quizId,
            __v: v,
            paranoid: false,
            freezed: { $exists: true },
          },
        })
      ).deletedCount
    ) {
      await this._savedQuizRepository.deleteMany({ filter: { quizId } });
    } else {
      throw new NotFoundException("Invalid quizId or Not freezed ❌");
    }

    return successHandler({ res });
  };
}

export default QuizService;
