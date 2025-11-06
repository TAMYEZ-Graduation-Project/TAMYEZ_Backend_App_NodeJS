import type { Request } from "express";

class StringConstants {
  static readonly GENERIC_ERROR_MESSAGE =
    "An unexpected error occurred. Please try again later. 🤔";

  static readonly SOMETHING_WRONG_MESSAGE = "Something went wrong. 🤔";

  static readonly CONNECTED_TO_DB_MESSAGE = `Connected to DB Successfully 👌`;

  static readonly FAILED_CONNECTED_TO_DB_MESSAGE = `Failed to Connect to DB ☠️`;

  static readonly DONE_MESSAGE = "Done ✅";

  static readonly EMAIL_CONTENT_MISSING_MESSAGE = "Can't Send Email, because Email Content is Missing 🔍"

  static WRONG_ROUTE_MESSAGE(req: Request): string {
    return `Wrong URI ${req.url} or METHOD ${req.method} ⛔`;
  }

  static ERROR_STARTING_SERVER_MESSAGE(error: Error): string {
    return `Error Starting the Server ❌: ${error}`;
  }

  static SERVER_STARTED_MESSAGE(port: string): string {
    return `Server Started on PORT ${process.env.PORT} 🚀`;
  }
}
export default StringConstants;
