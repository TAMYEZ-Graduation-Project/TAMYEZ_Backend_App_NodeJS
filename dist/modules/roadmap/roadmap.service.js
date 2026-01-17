import { CareerModel, RoadmapStepModel } from "../../db/models/index.js";
import { CareerRepository, RoadmapStepRepository, } from "../../db/repositories/index.js";
import successHandler from "../../utils/handlers/success.handler.js";
import { BadRequestException, ConflictException, NotFoundException, ServerException, } from "../../utils/exceptions/custom.exceptions.js";
class RoadmapService {
    _careerRepository = new CareerRepository(CareerModel);
    _roadmapStepRepository = new RoadmapStepRepository(RoadmapStepModel);
    createRoadmapStep = async (req, res) => {
        const { careerId, title, order, description, courses, youtubePlaylists, books, } = req.validationResult.body;
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
                throw new BadRequestException(`Step order must be sequential with no gaps. Current stepsCount is ${career.stepsCount} ❌`);
            }
        }
        const [newStep] = await this._roadmapStepRepository.create({
            data: [
                {
                    careerId: careerId,
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
            throw new ServerException("Failed to create roadmap step, please try again ❌");
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
