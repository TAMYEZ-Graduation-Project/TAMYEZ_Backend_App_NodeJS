import StringConstants from "../constants/strings.constants.js";
const listUpdateFieldsHandler = ({ resourceName, body, attachmentSubKey = "", pictureFieldName = "pictureUrl", }) => {
    const setObj = {};
    for (const [k, v] of Object.entries(body)) {
        setObj[`${resourceName}.$[el].${k == StringConstants.ATTACHMENT_FIELD_NAME ? `${pictureFieldName}` : k}`] = k == StringConstants.ATTACHMENT_FIELD_NAME ? attachmentSubKey : v;
    }
    return setObj;
};
export default listUpdateFieldsHandler;
