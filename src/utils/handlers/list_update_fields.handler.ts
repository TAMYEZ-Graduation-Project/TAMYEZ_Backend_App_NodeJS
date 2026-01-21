import StringConstants from "../constants/strings.constants.ts";

const listUpdateFieldsHandler = <
  T extends Record<string, any> = Record<string, any>,
>({
  resourceName,
  body,
  attachmentSubKey = "",
  pictureFieldName = "pictureUrl",
}: {
  resourceName: string;
  body: T;
  attachmentSubKey?: string | undefined;
  pictureFieldName?: string;
}): Record<string, any> => {
  const setObj: Record<string, any> = {};
  for (const [k, v] of Object.entries(body)) {
    setObj[
      `${resourceName}.$[el].${k == StringConstants.ATTACHMENT_FIELD_NAME ? `${pictureFieldName}` : k}`
    ] = k == StringConstants.ATTACHMENT_FIELD_NAME ? attachmentSubKey : v;
  }

  return setObj;
};

export default listUpdateFieldsHandler;
