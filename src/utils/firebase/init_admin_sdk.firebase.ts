import admin from "firebase-admin";
import EnvFields from "../constants/env_fields.constants.ts";

const decoded = Buffer.from(
  process.env[EnvFields.FIREBASE_ADMIN_KEY]!,
  "base64"
).toString("utf8");

const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
