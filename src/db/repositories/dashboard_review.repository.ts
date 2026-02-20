import type { Model } from "mongoose";
import type { IDashboardReview as TDocument } from "../interfaces/dashboard_review.interface.ts";
import DatabaseRepository from "./database.repository.ts";

class DashboardReviewRepository extends DatabaseRepository<TDocument> {
  constructor(model: Model<TDocument>) {
    super(model);
  }
}
export default DashboardReviewRepository;
