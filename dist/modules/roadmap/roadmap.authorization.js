import { RolesEnum } from "../../utils/constants/enum.constants.js";
const roadmapAuthorizationEndpoints = {
    createRoadmapStep: [RolesEnum.admin, RolesEnum.superAdmin],
};
export default roadmapAuthorizationEndpoints;
