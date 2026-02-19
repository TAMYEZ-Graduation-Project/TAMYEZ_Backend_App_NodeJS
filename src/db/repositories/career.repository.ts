import type { Model } from "mongoose";
import type { ICareer as TDocument } from "../interfaces/career.interface.ts";
import DatabaseRepository from "./database.repository.ts";

class CareerRepository extends DatabaseRepository<TDocument> {
  constructor(model: Model<TDocument>) {
    super(model);
  }
}
export default CareerRepository;
