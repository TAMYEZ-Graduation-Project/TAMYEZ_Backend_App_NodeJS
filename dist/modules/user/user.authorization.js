import { RolesEnum } from "../../utils/constants/enum.constants.js";
export const userAuthorizationEndpoints = {
    getUsers: [RolesEnum.admin, RolesEnum.superAdmin],
};
