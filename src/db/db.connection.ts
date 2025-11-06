import mongoose from "mongoose";
import StringConstants from "../utils/constants/strings.constants.ts";

async function connnectToDB(): Promise<boolean> {
  try {
    await mongoose.connect(process.env.DB_URI!);
    console.log(StringConstants.CONNECTED_TO_DB_MESSAGE);
    return true;
  } catch (e) {
    console.log(StringConstants.FAILED_CONNECTED_TO_DB_MESSAGE, e);
    return false;
  }
}

export default connnectToDB;
