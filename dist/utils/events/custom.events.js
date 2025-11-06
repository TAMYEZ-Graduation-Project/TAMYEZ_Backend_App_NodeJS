import { EventEmitter } from "node:events";
import StringConstants from "../constants/strings.constants.js";
class CustomEvents {
    emitter;
    constructor(emitter) {
        this.emitter = emitter;
    }
    subscribe = ({ eventName, bgFunction, }) => {
        this.emitter.on(eventName, async (args) => {
            try {
                await bgFunction(args);
            }
            catch (e) {
                console.log(StringConstants.FAILED_EXECUTING_EVENT_MESSAGE(eventName, e));
            }
        });
    };
    publish = ({ eventName, payload }) => {
        this.emitter.emit(eventName, payload);
    };
}
export default CustomEvents;
