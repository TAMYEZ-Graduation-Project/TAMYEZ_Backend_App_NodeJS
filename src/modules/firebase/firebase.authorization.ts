import { RolesEnum } from "../../utils/constants/enum.constants.ts";

const firebaseAuthorizationEndpoints = {
  sendNotification: [RolesEnum.admin, RolesEnum.superAdmin],
};

export default firebaseAuthorizationEndpoints;
