import type { Model } from "mongoose";
import type { IRoadmapStep as TDocument } from "../interfaces/roadmap_step.interface.ts";
import DatabaseRepository from "./database.repository.ts";

class RoadmapStepRepository extends DatabaseRepository<TDocument> {
  constructor(model: Model<TDocument>) {
    super(model);
  }
}
export default RoadmapStepRepository;
