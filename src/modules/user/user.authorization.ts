import { RolesEnum } from "../../utils/constants/enum.constants.ts";

export const userAuthorizationEndpoints = {
  getUsers: [RolesEnum.admin, RolesEnum.superAdmin],
};
