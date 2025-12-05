import type { Request, Response } from "express";
import { QuizModel, QuizQuestionsModel } from "../../db/models/index.ts";
import {
  QuizQuestionsRepository,
  QuizRepository,
} from "../../db/repositories/index.ts";
import successHandler from "../../utils/handlers/success.handler.ts";
import type {
  CreateQuizBodyDtoType,
  GetQuizParamsDtoType,
  UpdateQuizBodyDtoType,
  UpdateQuizParamsDtoType,
} from "./quiz.dto.ts";
import {
  QuestionTypesEnum,
  QuizTypesEnum,
  RolesEnum,
} from "../../utils/constants/enum.constants.ts";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServerException,
  ValidationException,
} from "../../utils/exceptions/custom.exceptions.ts";
import StringConstants from "../../utils/constants/strings.constants.ts";
import QuizUtil from "../../utils/quiz/utils.quiz.ts";
import UpdateUtil from "../../utils/update/util.update.ts";
import type { HIQuiz } from "../../db/interfaces/quiz.interface.ts";
import type { IGetQuizDetailsResponse } from "./quiz.entity.ts";
import type { IQuestion } from "../../db/interfaces/quiz_questions.interface.ts";

class QuizService {
  private _quizRepository = new QuizRepository(QuizModel);
  private _quizQuestionsRepository = new QuizQuestionsRepository(
    QuizQuestionsModel
  );
  //private _quizApisManager = new QuizApisManager();

  createQuiz = async (req: Request, res: Response): Promise<Response> => {
    const { title, description, aiPrompt, type, duration, tags } = req
      .validationResult.body as CreateQuizBodyDtoType;

    if (type === QuizTypesEnum.careerAssesment) {
      const quiz = await this._quizRepository.findOne({ filter: { type } });
      if (quiz) {
        throw new ConflictException(
          `Quiz of type ${QuizTypesEnum.careerAssesment} already exists 🚫`
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
      quiz.type === QuizTypesEnum.careerAssesment &&
      (type || duration || tags?.length)
    ) {
      throw new ValidationException(
        `Only description and aiPrompt of ${StringConstants.CAREER_ASSESSMENT} can be updated 🔒`
      );
    } else {
      if (type === QuizTypesEnum.careerAssesment) {
        throw new BadRequestException(
          `${QuizTypesEnum.stepQuiz} can not be update to ${QuizTypesEnum.careerAssesment} 🔒`
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
    quizId === QuizTypesEnum.careerAssesment
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
  }: {
    title: string;
    aiPrompt: string;
  }): Promise<{
    title: string;
    questions: (IQuestion & { options?: string[] })[];
  }> => {
    return {
      title,
      questions: [
        {
          type: "mcq-single" as QuestionTypesEnum,
          text: "Which data structure uses LIFO (Last In, First Out) principle?",
          options: ["Queue", "Stack", "Array", "Linked List"],
          correctAnswer: "Stack",
        },
        {
          type: "mcq-single" as QuestionTypesEnum,
          text: "What is the time complexity of binary search in a sorted array?",
          options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
          correctAnswer: "O(log n)",
        },
        {
          type: "mcq-multi" as QuestionTypesEnum,
          text: "Which of the following are programming paradigms?",
          options: [
            "Object-Oriented",
            "Functional",
            "Procedural",
            "Relational",
          ],
          correctAnswer: ["Object-Oriented", "Functional", "Procedural"],
        },
        {
          type: "written" as QuestionTypesEnum,
          text: "Explain the difference between TCP and UDP.",
        },
        {
          type: "mcq-single" as QuestionTypesEnum,
          text: "Which algorithm is commonly used for shortest path in a graph?",
          options: [
            "Dijkstra's Algorithm",
            "Merge Sort",
            "DFS",
            "Bellman-Ford",
          ],
          correctAnswer: "Dijkstra's Algorithm",
        },
        {
          type: "mcq-single" as QuestionTypesEnum,
          text: "What does SQL stand for?",
          options: [
            "Structured Query Language",
            "Simple Query Language",
            "Sequential Query Language",
            "Standard Query Language",
          ],
          correctAnswer: "Structured Query Language",
        },
        {
          type: "mcq-multi" as QuestionTypesEnum,
          text: "Which of the following are NoSQL databases?",
          options: ["MongoDB", "PostgreSQL", "Cassandra", "Redis"],
          correctAnswer: ["MongoDB", "Cassandra", "Redis"],
        },
        {
          type: "written" as QuestionTypesEnum,
          text: "Describe the concept of polymorphism in object-oriented programming.",
        },
        {
          type: "mcq-single" as QuestionTypesEnum,
          text: "Which of these is NOT a valid HTTP method?",
          options: ["GET", "POST", "FETCH", "DELETE"],
          correctAnswer: "FETCH",
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
    quizId === QuizTypesEnum.careerAssesment
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

    const generatedQuestions = await this._generateQuestions({
      title: quiz.title,
      aiPrompt: quiz.aiPrompt,
    });

    // await this._quizApisManager.getQuizQustions({
    //   title: quiz.title,
    //   aiPrompt: quiz.aiPrompt,
    // });

    const writtenQuestionsIndexes: number[] = [];

    generatedQuestions.questions.forEach((value, index) => {
      if (value.type === QuestionTypesEnum.written)
        writtenQuestionsIndexes.push(index);
    });
    let [quizQuestions] = await this._quizQuestionsRepository.create({
      data: [
        {
          quizId: quiz._id,
          userId: req.user!._id!,
          writtenQuestionsIndexes,
          questions: generatedQuestions.questions,
          expiresAt: new Date(Date.now() + quiz.duration! * 1000),
        },
      ],
    });

    if (!quizQuestions) {
      throw new ServerException("Failed to generate quiz questions ❓");
    }

    return successHandler({
      res,
      body: {
        quiz: {
          ...quizQuestions.toJSON(),
          questions: quizQuestions.questions.map<
            IQuestion & { options: string[] }
          >((value, index): IQuestion & { options: string[] } => {
            return {
              id: value.id!,
              ...generatedQuestions.questions[index],
            } as IQuestion & { options: string[] };
          }),
        },
      },
    });
  };
}

export default QuizService;
