import { RolesEnum } from "../../utils/constants/enum.constants.ts";

const quizAuthorizationEndpoints = {
  createQuiz: [RolesEnum.admin, RolesEnum.superAdmin],
  updateQuiz: [RolesEnum.admin, RolesEnum.superAdmin],
};

export default quizAuthorizationEndpoints;
