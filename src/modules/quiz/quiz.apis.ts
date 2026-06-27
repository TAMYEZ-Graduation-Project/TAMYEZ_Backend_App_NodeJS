import axios from "axios";
import { BadRequestException } from "../../utils/exceptions/custom.exceptions.ts";
import type {
  IAIModelCheckCareerAssessmentQuestionsRequest,
  IAIModelCheckCareerAssessmentQuestionsResponse,
  IAIModelCheckWrittenQuestionsRequest,
  IAIModelCheckWrittenQuestionsResponse,
  IAIModelGenerateCareerAssessmentQuestionsRequest,
  IAIModelGeneratedCareerAssessmentQuestionsResponse,
  IAIModelGeneratedQuestionsResponse,
  IAIModelGenerateRoadmapStepQuizQuestionsRequest,
} from "../../utils/constants/interface.constants.ts";

class QuizApisManager {
  getCareerAssessmentQustions = async (
    payload: IAIModelGenerateCareerAssessmentQuestionsRequest,
  ): Promise<IAIModelGeneratedCareerAssessmentQuestionsResponse> => {
    try {
      const response = await axios.request({
        method: "POST",
        url: "http://host.docker.internal:8000/ai/generate-main-quiz",
        data: payload,
      });

      return response.data;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to get career assessment questions ❓❌, ${error.message}`,
      );
    }
  };

  checkCareerAssessmentQuestions = async (
    payload: IAIModelCheckCareerAssessmentQuestionsRequest,
  ): Promise<IAIModelCheckCareerAssessmentQuestionsResponse> => {
    try {
      const response = await axios.request({
        method: "POST",
        url: "http://host.docker.internal:8000/ai/evaluate-and-match",
        data: JSON.stringify(payload, null, 2),
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to check career assessment questions ❓❌, ${error}`,
      );
    }
  };
  getRoadmapStepQuestions = async (
    payload: IAIModelGenerateRoadmapStepQuizQuestionsRequest,
  ): Promise<IAIModelGeneratedQuestionsResponse> => {
    try {
      const response = await axios.request({
        method: "POST",
        url: "http://host.docker.internal:8000/ai/generate-sub-quiz",
        data: JSON.stringify(payload, null, 2),
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to check career assessment questions ❓❌, ${error}`,
      );
    }
  };

  checkRoadmapWrittenAnswers = async (
    payload: IAIModelCheckWrittenQuestionsRequest,
  ): Promise<IAIModelCheckWrittenQuestionsResponse> => {
    try {
      const response = await axios.request({
        method: "POST",
        url: "http://host.docker.internal:8000/ai/evaluate-written-answers",
        data: JSON.stringify(payload, null, 2),
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {      
      throw new BadRequestException(
        `Failed to check quiz questions ❓❌, ${error}`,
      );
    }
  };
}

export default QuizApisManager;
