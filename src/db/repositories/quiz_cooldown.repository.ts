import type { Model } from "mongoose";
import type { IQuizCooldown as TDocument } from "../interfaces/quiz_cooldown.interface.ts";
import DatabaseRepository from "./database.repository.ts";

class QuizCooldownRepository extends DatabaseRepository<TDocument> {
  constructor(model: Model<TDocument>) {
    super(model);
  }
}
export default QuizCooldownRepository;
