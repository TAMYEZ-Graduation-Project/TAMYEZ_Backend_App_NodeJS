import type { Model } from "mongoose";
import type { IFeedback as TDocument } from "../interfaces/feedback.interface.ts";
import DatabaseRepository from "./database.repository.ts";

class FeedbackRepository extends DatabaseRepository<TDocument> {
  constructor(model: Model<TDocument>) {
    super(model);
  }
}
export default FeedbackRepository;
