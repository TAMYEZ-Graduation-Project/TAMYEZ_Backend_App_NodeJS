import { Router } from "express";
import { BadRequestException } from "../utils/exceptions/custom.exceptions.js";
import S3Service from "../utils/multer/s3.service.js";
import asyncPipeline from "../utils/stream/async_pipeline.stream.js";
import validationMiddleware from "../middlewares/validation.middleware.js";
import UploadsValidators from "./uploads.validation.js";
import successHandler from "../utils/handlers/success.handler.js";
import RoutePaths from "../utils/constants/route_paths.constants.js";
const uploadsRouter = Router();
uploadsRouter.get(RoutePaths.getFileFromSubKeyByPresignedUrl, validationMiddleware({ schema: UploadsValidators.getFileFromSubKey }), async (req, res) => {
    const { download, downloadName } = req.query;
    const { path } = req.params;
    const SubKey = path.join("/");
    const signedUrl = await S3Service.createPresignedGetUrl({
        SubKey,
        download,
        downloadName,
    });
    return successHandler({
        req,
        res,
        message: "Presigned URL Generated !",
        body: { url: signedUrl },
    });
});
uploadsRouter.get(RoutePaths.getFileFromSubKey, validationMiddleware({ schema: UploadsValidators.getFileFromSubKey }), async (req, res) => {
    const { download, downloadName } = req.query;
    const { path } = req.params;
    const SubKey = path.join("/");
    const s3Response = await S3Service.getFile({ SubKey });
    if (!s3Response?.Body) {
        throw new BadRequestException("Failed to fetch this asset ☹️");
    }
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Content-Type", s3Response.ContentType || "application/octet-stream");
    if (download === "true") {
        res.setHeader("Content-Disposition", `attachment; filename="${downloadName
            ? `${downloadName}.${s3Response.ContentType?.split("/")[1]}`
            : SubKey.split("/").pop()}"`);
    }
    return asyncPipeline({
        source: s3Response.Body,
        destination: res,
    });
});
export default uploadsRouter;
