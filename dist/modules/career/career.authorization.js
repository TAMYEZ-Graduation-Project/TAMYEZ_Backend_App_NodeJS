import { RolesEnum } from "../../utils/constants/enum.constants.js";
const careerAuthorizationEndpoints = {
    createCareer: [RolesEnum.admin, RolesEnum.superAdmin]
};
export default careerAuthorizationEndpoints;
