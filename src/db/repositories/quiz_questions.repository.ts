import type { Model } from "mongoose";
import type { IQuizAttempt as TDocument } from "../interfaces/quiz_questions.interface.ts";
import DatabaseRepository from "./database.repository.ts";

class QuizAttemptRepository extends DatabaseRepository<TDocument> {
  constructor(model: Model<TDocument>) {
    super(model);
  }
}
export default QuizAttemptRepository;
