export const roadmapStepArraySchemaValidator = () => {
    return {
        validator: function (value) {
            if (Array.isArray(value) && value.length >= 1 && value.length <= 5) {
                return true;
            }
            return false;
        },
        message: () => `must be an erray of length between 1 and 5 ❌`,
    };
};
export const careerArraySchemaValidator = () => {
    return {
        validator: function (value) {
            if (Array.isArray(value) && value.length <= 5) {
                return true;
            }
            return false;
        },
        message: () => `must be an erray of max length 5 ❌`,
    };
};
