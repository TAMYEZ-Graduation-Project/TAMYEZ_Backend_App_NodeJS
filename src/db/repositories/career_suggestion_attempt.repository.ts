import type { Model } from "mongoose";
import type { ICareerSuggestionAttempt as TDocument } from "../interfaces/career_suggestion_attempt.interface.ts";
import DatabaseRepository from "./database.repository.ts";

class CareerSuggestionAttemptRepository extends DatabaseRepository<TDocument> {
  constructor(model: Model<TDocument>) {
    super(model);
  }
}
export default CareerSuggestionAttemptRepository;
