import type { Model } from "mongoose";
import type { IQuizQuestions as TDocument } from "../interfaces/quiz_questions.interface.ts";
import DatabaseRepository from "./database.repository.ts";

class QuizQuestionsRepository extends DatabaseRepository<TDocument> {
  constructor(model: Model<TDocument>) {
    super(model);
  }
}
export default QuizQuestionsRepository;
