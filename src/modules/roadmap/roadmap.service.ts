import { CareerModel, RoadmapStepModel } from "../../db/models/index.ts";
import {
  CareerRepository,
  RoadmapStepRepository,
} from "../../db/repositories/index.ts";
import type { Request, Response } from "express";
import successHandler from "../../utils/handlers/success.handler.ts";
import type { CreateRoadmapStepBodyDto } from "./roadmap.dto.ts";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServerException,
} from "../../utils/exceptions/custom.exceptions.ts";
import type { Types } from "mongoose";

class RoadmapService {
  private readonly _careerRepository = new CareerRepository(CareerModel);
  private readonly _roadmapStepRepository = new RoadmapStepRepository(
    RoadmapStepModel
  );

  createRoadmapStep = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const {
      careerId,
      title,
      order,
      description,
      courses,
      youtubePlaylists,
      books,
    } = req.validationResult.body as CreateRoadmapStepBodyDto;

    const career = await this._careerRepository.findOne({
      filter: { _id: careerId },
    });
    if (!career) {
      throw new NotFoundException("Invalid careerId or career freezed ❌");
    }

    const stepExists = await this._roadmapStepRepository.findOne({
      filter: { careerId, title },
    });

    if (stepExists) {
      throw new ConflictException("Step with this title already exists ❌");
    }

    if (order && order > 0) {
      if (order <= career.stepsCount && career.stepsCount > 0) {
        await this._roadmapStepRepository.updateMany({
          filter: {
            careerId,
            order: { $gte: Number(order) },
          },
          update: { $inc: { order: 500 } },
        });
      }

      if (order > career.stepsCount + 1) {
        throw new BadRequestException(
          `Step order must be sequential with no gaps. Current stepsCount is ${career.stepsCount} ❌`
        );
      }
    }

    const [newStep] = await this._roadmapStepRepository.create({
      data: [
        {
          careerId: careerId as unknown as Types.ObjectId,
          title,
          order: order ?? career.stepsCount + 1,
          description,
          courses,
          youtubePlaylists,
          books,
        },
      ],
    });

    if (!newStep) {
      throw new ServerException(
        "Failed to create roadmap step, please try again ❌"
      );
    }

    await Promise.all([
      career.updateOne({
        $inc: { stepsCount: 1 },
      }),
      this._roadmapStepRepository.updateMany({
        filter: {
          careerId,
          order: { $gt: Number(order) },
        },
        update: { $inc: { order: -499 } },
      }),
    ]);

    return successHandler({
      res,
      message: "Roadmap step created successfully ✅",
    });
  };
}

export default RoadmapService;
