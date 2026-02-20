import mongoose from "mongoose";
import StringConstants from "../utils/constants/strings.constants.ts";
import DashboardReviewRepository from "./repositories/dashboard_review.repository.ts";
import DashboardReviewModel from "./models/dashboard_review.model.ts";
import { DashboardReviewTypes } from "../utils/constants/enum.constants.ts";
import type { FullIUser } from "./interfaces/user.interface.ts";

async function connnectToDB(): Promise<boolean> {
  try {
    await mongoose.connect(process.env.DB_URI!);
    console.log(mongoose.connection.models);
    console.log(StringConstants.CONNECTED_TO_DB_MESSAGE);
    setTimeout(async () => {
      await startCollectionWatcher();
    }, 500);
    return true;
  } catch (e) {
    console.log(StringConstants.FAILED_CONNECTED_TO_DB_MESSAGE, e);
    return false;
  }
}

let dashboardReviewRepository: DashboardReviewRepository;
async function startCollectionWatcher() {
  // Users Watcher
  await ensurePreImagesEnabled("users");
  const usersStream = mongoose.connection.db?.collection("users").watch([], {
    fullDocument: "updateLookup",
    fullDocumentBeforeChange: "required",
  });

  dashboardReviewRepository = new DashboardReviewRepository(
    DashboardReviewModel,
  );

  usersStream?.on("change", async (change) => {
    try {
      if (change.operationType === "insert") {
        await dashboardReviewRepository.updateOne({
          filter: { reviewType: DashboardReviewTypes.users },
          update: {
            $inc: { activeCount: 1n },
          },
          options: { upsert: true },
        });
      } else if (
        change.operationType === "update" ||
        change.operationType === "replace"
      ) {
        const before = change.fullDocumentBeforeChange as FullIUser | undefined;
        const after = change.fullDocument as FullIUser | undefined;
        let incValue;
        if (
          (before?.freezed == undefined ||
            (before?.freezed != undefined &&
              before.freezed.by.equals(before._id))) &&
          after?.freezed != undefined &&
          !after.freezed.by.equals(after._id)
        ) {
          incValue = -1n;
        } else if (
          before?.freezed != undefined &&
          !before.freezed.by.equals(before._id) &&
          after?.freezed == undefined
        ) {
          incValue = 1n;
        }
        if (incValue)
          await dashboardReviewRepository.updateOne({
            filter: { reviewType: DashboardReviewTypes.users },
            update: { $inc: { activeCount: incValue } },
          });
      } else if (change.operationType === "delete") {
        const before = change.fullDocumentBeforeChange as FullIUser | undefined;
        if (before?.freezed == undefined)
          await dashboardReviewRepository.updateOne({
            filter: { reviewType: DashboardReviewTypes.users },
            update: {
              $inc: { activeCount: -1n },
            },
          });
      }
    } catch (error) {
      console.error("users change handler error:", error);
    }
  });

  // Careers Watcher
  await ensurePreImagesEnabled("careers");
  const careersStream = mongoose.connection.db
    ?.collection("careers")
    .watch([], {
      fullDocument: "updateLookup",
      fullDocumentBeforeChange: "required",
    });

  careersStream?.on(
    "change",
    handleChange({ reviewType: DashboardReviewTypes.careers }),
  );

  // Quiz Watcher
  await ensurePreImagesEnabled("quizzes");
  const quizzesStream = mongoose.connection.db
    ?.collection("quizzes")
    .watch([], {
      fullDocument: "updateLookup",
      fullDocumentBeforeChange: "required",
    });

  quizzesStream?.on(
    "change",
    handleChange({ reviewType: DashboardReviewTypes.quizzes }),
  );
}

async function ensurePreImagesEnabled(collectionName: string) {
  if (!mongoose.connection.db) return;
  try {
    await mongoose.connection.db.command({
      collMod: collectionName,
      changeStreamPreAndPostImages: { enabled: true },
    });
  } catch (err: any) {
    // NamespaceNotFound (code 26) => collection does not exist
    if (err?.code === 26 || /NamespaceNotFound/i.test(err?.errmsg || "")) {
      // Create the collection with the desired option
      await mongoose.connection.db.createCollection(collectionName, {
        changeStreamPreAndPostImages: { enabled: true },
      });
    } else {
      console.error(
        `Error ensuring pre-images enabled for ${collectionName}:`,
        err,
      );
    }
  }
}

function handleChange({ reviewType }: { reviewType: DashboardReviewTypes }) {
  return async (
    change: mongoose.mongo.ChangeStreamDocument<mongoose.mongo.BSON.Document>,
  ) => {
    try {
      if (change.operationType === "insert") {
        await dashboardReviewRepository.updateOne({
          filter: { reviewType },
          update: {
            $inc: { activeCount: 1n },
          },
          options: { upsert: true },
        });
      } else if (
        change.operationType === "update" ||
        change.operationType === "replace"
      ) {
        const before = change.fullDocumentBeforeChange as FullIUser | undefined;
        const after = change.fullDocument as FullIUser | undefined;
        let incValue;
        if (before?.freezed == undefined && after?.freezed != undefined) {
          incValue = -1n;
        } else if (
          before?.freezed != undefined &&
          after?.freezed == undefined
        ) {
          incValue = 1n;
        }
        if (incValue)
          await dashboardReviewRepository.updateOne({
            filter: { reviewType },
            update: { $inc: { activeCount: incValue } },
          });
      }
    } catch (error) {
      console.error(`${reviewType.toString()} change handler error:`, error);
    }
  };
}

export default connnectToDB;
