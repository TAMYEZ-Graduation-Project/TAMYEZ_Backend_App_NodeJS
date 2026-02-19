import { RolesEnum } from "../../utils/constants/enum.constants.ts";

const roadmapAuthorizationEndpoints = {
  createRoadmapStep: [RolesEnum.admin, RolesEnum.superAdmin],
};

export default roadmapAuthorizationEndpoints;
