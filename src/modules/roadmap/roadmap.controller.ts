import { Router } from "express";
import RoadmapService from "./roadmap.service.ts";

const roadmapRouter: Router = Router();
const roadmapService = new RoadmapService();

export default roadmapRouter;
