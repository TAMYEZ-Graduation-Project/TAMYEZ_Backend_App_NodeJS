import type { Model } from "mongoose";
import type { INotificationPushDevice as TDocument } from "../interfaces/notification_push_device.interface.ts";
import DatabaseRepository from "./database.repository.ts";

class NotifictionPushDeviceRepository extends DatabaseRepository<TDocument> {
  constructor(model: Model<TDocument>) {
    super(model);
  }
}
export default NotifictionPushDeviceRepository;
