import type { Request, Response } from "express";
import {
  QuizCooldownModel,
  QuizModel,
  QuizAttemptModel,
  SavedQuizModel,
} from "../../db/models/index.ts";
import {
  QuizAttemptRepository,
  QuizRepository,
} from "../../db/repositories/index.ts";
import successHandler from "../../utils/handlers/success.handler.ts";
import type {
  CheckQuizAnswersBodyDtoType,
  CheckQuizAnswersParamsDtoType,
  CreateQuizBodyDtoType,
  GetQuizParamsDtoType,
  GetSavedQuizParamsDtoType,
  GetSavedQuizzesQueryDtoType,
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

class QuizService {
  private _quizRepository = new QuizRepository(QuizModel);
  private _quizQuestionsRepository = new QuizAttemptRepository(
    QuizAttemptModel
  );
  private _savedQuizRepository = new SavedQuizRepository(SavedQuizModel);
  private _quizCooldownRepository = new QuizCooldownRepository(
    QuizCooldownModel
  );
  //private _quizApisManager = new QuizApisManager();

  createQuiz = async (req: Request, res: Response): Promise<Response> => {
    const { title, description, aiPrompt, type, duration, tags } = req
      .validationResult.body as CreateQuizBodyDtoType;

    if (type === QuizTypesEnum.careerAssessment) {
      const quiz = await this._quizRepository.findOne({ filter: { type } });
      if (quiz) {
        throw new ConflictException(
          `Quiz of type ${QuizTypesEnum.careerAssessment} already exists 🚫`
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
        "A quiz with the same title and tags already exists ❌"
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
    const { title, description, aiPrompt, type, duration, tags } = req
      .validationResult.body as UpdateQuizBodyDtoType;

    const quiz = await this._quizRepository.findOne({
      filter: { _id: quizId, paranoid: false },
    });

    if (!quiz) {
      throw new NotFoundException(
        StringConstants.INVALID_PARAMETER_MESSAGE("quizId")
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
        `Only description and aiPrompt of ${StringConstants.CAREER_ASSESSMENT} can be updated 🔒`
      );
    } else {
      if (type === QuizTypesEnum.careerAssessment) {
        throw new BadRequestException(
          `${QuizTypesEnum.stepQuiz} can not be update to ${QuizTypesEnum.careerAssessment} 🔒`
        );
      }
      if (title || tags) {
        if (
          await this._quizRepository.findOne({
            filter: { uniqueKey },
          })
        ) {
          throw new ConflictException(
            "A quiz with the same title and tags already exists ❌"
          );
        }
      }
    }

    const updateObject = UpdateUtil.getChangedFields<HIQuiz>({
      document: quiz,
      updatedObject: { title, description, aiPrompt, type, duration, tags },
    });

    await quiz.updateOne({
      uniqueKey:
        updateObject.title || updateObject.tags?.length ? uniqueKey : undefined,
      ...updateObject,
      __v: { $inc: 1 },
    });

    return successHandler({
      res,
      message: StringConstants.CREATED_SUCCESSFULLY_MESSAGE("Quiz"),
    });
  };

  getQuizDetails = async (req: Request, res: Response): Promise<Response> => {
    const { quizId } = req.params as GetQuizParamsDtoType;

    const projection: { aiPrompt?: 1 | 0; tags?: 1 | 0 } = {};
    if (req.user!.role === RolesEnum.user) {
      projection.aiPrompt = 0;
      projection.tags = 0;
    }

    const filter: { _id?: string; uniqueKey?: Record<any, any> } = {};
    quizId === QuizTypesEnum.careerAssessment
      ? (filter.uniqueKey = {
          $regex: StringConstants.CAREER_ASSESSMENT,
          $options: "i",
        })
      : (filter._id = quizId);

    const quiz = await this._quizRepository.findOne({
      filter: {
        ...filter,
        paranoid: req.user!.role !== RolesEnum.user ? false : true,
      },
      projection,
    });

    if (!quiz) {
      throw new NotFoundException(
        StringConstants.INVALID_PARAMETER_MESSAGE("quizId")
      );
    }

    return successHandler<IGetQuizDetailsResponse>({ res, body: { quiz } });
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
    const { quizId } = req.params as GetQuizParamsDtoType;

    const filter: { _id?: string; uniqueKey?: Record<any, any> } = {};
    quizId === QuizTypesEnum.careerAssessment
      ? (filter.uniqueKey = {
          $regex: StringConstants.CAREER_ASSESSMENT,
          $options: "i",
        })
      : (filter._id = quizId);

    const quiz = await this._quizRepository.findOne({
      filter: {
        ...filter,
        paranoid: req.user!.role !== RolesEnum.user ? false : true,
      },
    });

    if (!quiz) {
      throw new NotFoundException(
        StringConstants.INVALID_PARAMETER_MESSAGE("quizId")
      );
    }

    if (req.user!.quizAttempts?.lastAttempt) {
      if (
        req.user!.quizAttempts.count >= 5 &&
        Date.now() - req.user!.quizAttempts.lastAttempt.getTime() <=
          15 * 60 * 1000
      ) {
        throw new TooManyRequestsException(
          "Too many request, please wait 15 minutes from your last quiz attempt ⏳"
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
      await this._quizCooldownRepository.findOne({
        filter: { quizId: quiz._id, userId: req.user!._id! },
      })
    ) {
      throw new BadRequestException(
        `You are in cooldown period for this quiz. Please try again later ❌`
      );
    }

    const [_, generatedQuestions] = await Promise.all([
      this._quizQuestionsRepository.deleteOne({
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

    let [quizQuestions] = await this._quizQuestionsRepository.create({
      data: [
        {
          quizId: quiz._id,
          userId: req.user!._id!,
          questions: generatedQuestions.questions,
          expiresAt: new Date(
            Date.now() +
              (quizId === QuizTypesEnum.careerAssessment ||
              quiz.title == StringConstants.CAREER_ASSESSMENT
                ? Number(
                    process.env[
                      EnvFields.CAREER_ASSESSMENT_QUESTIONS_EXPIRES_IN_SECONDS
                    ]
                  )
                : quiz.duration! +
                  Number(
                    process.env[EnvFields.QUIZ_QUESTIONS_EXPIRES_IN_SECONDS]
                  )) *
                1000
          ),
        },
      ],
    });

    if (!quizQuestions) {
      throw new ServerException("Failed to generate quiz questions ❓");
    }

    if (!req.user!.quizAttempts?.count) {
      req.user!.quizAttempts = { count: 0, lastAttempt: new Date() };
    }
    await req.user?.save();

    const quizQuestionsObj = quizQuestions.toJSON();
    if (quizId === QuizTypesEnum.careerAssessment) {
      delete quizQuestionsObj.id;
    }

    return successHandler<IGetQuizQuestionsResponse>({
      res,
      body: {
        quiz: quizQuestionsObj,
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
    const { quizId } = req.params as CheckQuizAnswersParamsDtoType;
    const { answers } = req.validationResult
      .body as CheckQuizAnswersBodyDtoType;

    const quizQuestions = await this._quizQuestionsRepository.findOne({
      filter: { _id: quizId, userId: req.user!._id! },
      options: {
        populate: [
          {
            path: "quizId",
            match: { freezed: { $exists: false } },
            select: "title aiPrompt",
          },
        ],
      },
    });

    if (!quizQuestions || !quizQuestions.quizId) {
      throw new NotFoundException(
        "Quiz questions not found for the given quizId and user 🚫"
      );
    }

    if (
      (quizQuestions.quizId as unknown as HIQuiz).title ===
      StringConstants.CAREER_ASSESSMENT
    ) {
      throw new BadRequestException(
        `Answers of ${StringConstants.CAREER_ASSESSMENT} quiz, use get suggested careers API 🚫`
      );
    }

    if (answers.length !== quizQuestions.questions.length) {
      throw new ValidationException(
        "Number of answers provided does not match number of questions ❌"
      );
    }

    // ---- Build maps once (O(n)) ----
    const questions = quizQuestions.questions as HIQuestion[];
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
          `Not found questionId in the quiz questions ${answer.questionId} ❌`
        );
      } else if (question.type !== answer.type) {
        throw new ValidationException(
          `Question type mismatch for questionId ${answer.questionId} ❌`
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
      title: (quizQuestions.quizId as unknown as HIQuiz).title,
      aiPrompt: (quizQuestions.quizId as unknown as HIQuiz).aiPrompt!,
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
            (wa) => wa.questionId === writtenAnswerResult.questionId
          )!.userAnswer,
        });
      } else {
        wrongAnswersCount++;
        checkedAnswers.splice(question.index!, 0, {
          ...question,
          isCorrect: false,
          userAnswer: writtenAnswers.find(
            (wa) => wa.questionId === writtenAnswerResult.questionId
          )!.userAnswer,
          correction: writtenAnswerResult.correction!,
          explanation: writtenAnswerResult.explenation!,
        });
      }
    }

    // saving the checked answers
    const scoreNumber = Math.round(
      ((checkedAnswers.length - wrongAnswersCount) / checkedAnswers.length) *
        100
    );

    if (scoreNumber >= 50) {
      if (
        !(await this._savedQuizRepository.findOneAndUpdate({
          filter: {
            quizId: quizQuestions.quizId!._id!,
            userId: req.user!._id!,
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
              quizId: quizQuestions.quizId!._id!,
              userId: req.user!._id!,
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
            quizId: quizQuestions.quizId!._id!,
            userId: req.user!._id!,
          },
        }),
        this._quizCooldownRepository.create({
          data: [
            {
              quizId: quizQuestions.quizId!._id!,
              userId: req.user!._id!,
              cooldownEndsAt: new Date(
                Date.now() +
                  Number(process.env[EnvFields.QUIZ_COOLDOWN_IN_SECONDS]) * 1000
              ),
            },
          ],
        }),
      ]);
    }

    await quizQuestions.deleteOne();
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
        populate: [{ path: "quizId", select: "title type duration" }],
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
        populate: [{ path: "quizId", select: "title type duration" }],
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
}

export default QuizService;
