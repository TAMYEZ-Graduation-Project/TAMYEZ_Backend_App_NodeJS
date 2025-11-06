import { EventEmitter } from "node:events";
import type { EventsEnum } from "../constants/enum.constants.ts";
import StringConstants from "../constants/strings.constants.ts";

class CustomEvents<T> {
  constructor(protected emitter: EventEmitter) {}

  subscribe = ({
    eventName,
    bgFunction,
  }: {
    eventName: EventsEnum;
    bgFunction: (payload: T) => Promise<void>;
  }) => {
    this.emitter.on(eventName, async (args) => {
      try {
        await bgFunction(args);
      } catch (e) {
        console.log(
          StringConstants.FAILED_EXECUTING_EVENT_MESSAGE(eventName, e as Error)
        );
      }
    });
  };

  publish = ({ eventName, payload }: { eventName: EventsEnum; payload: T }) => {
    this.emitter.emit(eventName, payload);
  };
}

export default CustomEvents;
