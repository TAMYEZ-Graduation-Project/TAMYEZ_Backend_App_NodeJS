import type { Model } from "mongoose";
import type { IAdminNotificationsLimit as TDocument } from "../interfaces/admin_notifications_limit.interface.ts";
import DatabaseRepository from "./database.repository.ts";

class AdminNotificationsLimitRepository extends DatabaseRepository<TDocument> {
  constructor(model: Model<TDocument>) {
    super(model);
  }
}
export default AdminNotificationsLimitRepository;
