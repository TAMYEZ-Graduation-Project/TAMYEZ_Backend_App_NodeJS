import type { Model } from "mongoose";
import type { IUserCareerProgress as TDocument } from "../interfaces/user_career_progress.interface.ts";
import DatabaseRepository from "./database.repository.ts";

class UserCareerProgressRepository extends DatabaseRepository<TDocument> {
  constructor(model: Model<TDocument>) {
    super(model);
  }
}
export default UserCareerProgressRepository;
