import { RolesEnum } from "../../utils/constants/enum.constants.ts";

const careerAuthorizationEndpoints = {
    createCareer:[RolesEnum.admin,RolesEnum.superAdmin]
}

export default careerAuthorizationEndpoints;