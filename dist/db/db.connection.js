import mongoose from "mongoose";
import StringConstants from "../utils/constants/strings.constants.js";
import DashboardReviewRepository from "./repositories/dashboard_review.repository.js";
import DashboardReviewModel from "./models/dashboard_review.model.js";
import { DashboardReviewTypes } from "../utils/constants/enum.constants.js";
async function connnectToDB() {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log(mongoose.connection.models);
        console.log(StringConstants.CONNECTED_TO_DB_MESSAGE);
        setTimeout(async () => {
            await startCollectionWatcher();
        }, 500);
        return true;
    }
    catch (e) {
        console.log(StringConstants.FAILED_CONNECTED_TO_DB_MESSAGE, e);
        return false;
    }
}
let dashboardReviewRepository;
async function startCollectionWatcher() {
    await ensurePreImagesEnabled("users");
    const usersStream = mongoose.connection.db?.collection("users").watch([], {
        fullDocument: "updateLookup",
        fullDocumentBeforeChange: "required",
    });
    dashboardReviewRepository = new DashboardReviewRepository(DashboardReviewModel);
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
            }
            else if (change.operationType === "update" ||
                change.operationType === "replace") {
                const before = change.fullDocumentBeforeChange;
                const after = change.fullDocument;
                let incValue;
                if ((before?.freezed == undefined ||
                    (before?.freezed != undefined &&
                        before.freezed.by.equals(before._id))) &&
                    after?.freezed != undefined &&
                    !after.freezed.by.equals(after._id)) {
                    incValue = -1n;
                }
                else if (before?.freezed != undefined &&
                    !before.freezed.by.equals(before._id) &&
                    after?.freezed == undefined) {
                    incValue = 1n;
                }
                if (incValue)
                    await dashboardReviewRepository.updateOne({
                        filter: { reviewType: DashboardReviewTypes.users },
                        update: { $inc: { activeCount: incValue } },
                    });
            }
            else if (change.operationType === "delete") {
                const before = change.fullDocumentBeforeChange;
                if (before?.freezed == undefined)
                    await dashboardReviewRepository.updateOne({
                        filter: { reviewType: DashboardReviewTypes.users },
                        update: {
                            $inc: { activeCount: -1n },
                        },
                    });
            }
        }
        catch (error) {
            console.error("users change handler error:", error);
        }
    });
    await ensurePreImagesEnabled("careers");
    const careersStream = mongoose.connection.db
        ?.collection("careers")
        .watch([], {
        fullDocument: "updateLookup",
        fullDocumentBeforeChange: "required",
    });
    careersStream?.on("change", handleChange({ reviewType: DashboardReviewTypes.careers }));
    await ensurePreImagesEnabled("quizzes");
    const quizzesStream = mongoose.connection.db
        ?.collection("quizzes")
        .watch([], {
        fullDocument: "updateLookup",
        fullDocumentBeforeChange: "required",
    });
    quizzesStream?.on("change", handleChange({ reviewType: DashboardReviewTypes.quizzes }));
}
async function ensurePreImagesEnabled(collectionName) {
    if (!mongoose.connection.db)
        return;
    try {
        await mongoose.connection.db.command({
            collMod: collectionName,
            changeStreamPreAndPostImages: { enabled: true },
        });
    }
    catch (err) {
        if (err?.code === 26 || /NamespaceNotFound/i.test(err?.errmsg || "")) {
            await mongoose.connection.db.createCollection(collectionName, {
                changeStreamPreAndPostImages: { enabled: true },
            });
        }
        else {
            console.error(`Error ensuring pre-images enabled for ${collectionName}:`, err);
        }
    }
}
function handleChange({ reviewType }) {
    return async (change) => {
        try {
            if (change.operationType === "insert") {
                await dashboardReviewRepository.updateOne({
                    filter: { reviewType },
                    update: {
                        $inc: { activeCount: 1n },
                    },
                    options: { upsert: true },
                });
            }
            else if (change.operationType === "update" ||
                change.operationType === "replace") {
                const before = change.fullDocumentBeforeChange;
                const after = change.fullDocument;
                let incValue;
                if (before?.freezed == undefined && after?.freezed != undefined) {
                    incValue = -1n;
                }
                else if (before?.freezed != undefined &&
                    after?.freezed == undefined) {
                    incValue = 1n;
                }
                if (incValue)
                    await dashboardReviewRepository.updateOne({
                        filter: { reviewType },
                        update: { $inc: { activeCount: incValue } },
                    });
            }
        }
        catch (error) {
            console.error(`${reviewType.toString()} change handler error:`, error);
        }
    };
}
export default connnectToDB;
