import { RolesEnum } from "../../utils/constants/enum.constants.js";
const firebaseAuthorizationEndpoints = {
    sendNotification: [RolesEnum.admin, RolesEnum.superAdmin],
};
export default firebaseAuthorizationEndpoints;
