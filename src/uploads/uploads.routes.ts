import { Router, type Request, type Response } from "express";
import { BadRequestException } from "../utils/exceptions/custom.exceptions.ts";
import S3Service from "../utils/multer/s3.service.ts";
import asyncPipeline from "../utils/stream/async_pipeline.stream.ts";
import validationMiddleware from "../middlewares/validation.middleware.ts";
import UploadsValidators from "./uploads.validation.ts";
import type {
  GetFileFromSubKeyParamsDtoType,
  GetFileFromSubKeyQueryDtoType,
} from "./uploads.dto.ts";
import successHandler from "../utils/handlers/success.handler.ts";
import RoutePaths from "../utils/constants/route_paths.constants.ts";

const uploadsRouter = Router();

uploadsRouter.get(
  RoutePaths.getFileFromSubKeyByPresignedUrl,
  validationMiddleware({ schema: UploadsValidators.getFileFromSubKey }),
  async (req: Request, res: Response): Promise<Response | void> => {
    const { download, downloadName } =
      req.query as GetFileFromSubKeyQueryDtoType;
    const { path } = req.params as unknown as GetFileFromSubKeyParamsDtoType;
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
  },
);

uploadsRouter.get(
  RoutePaths.getFileFromSubKey,
  validationMiddleware({ schema: UploadsValidators.getFileFromSubKey }),
  async (req: Request, res: Response): Promise<void> => {
    const { download, downloadName } =
      req.query as GetFileFromSubKeyQueryDtoType;
    const { path } = req.params as unknown as GetFileFromSubKeyParamsDtoType;
    const SubKey = path.join("/");

    const s3Response = await S3Service.getFile({ SubKey });
    if (!s3Response?.Body) {
      throw new BadRequestException("Failed to fetch this asset ☹️");
    }

    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader(
      "Content-Type",
      s3Response.ContentType || "application/octet-stream",
    );
    if (download === "true") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${
          downloadName
            ? `${downloadName}.${s3Response.ContentType?.split("/")[1]}`
            : SubKey.split("/").pop()
        }"`,
      );
    }

    await asyncPipeline({
      source: s3Response.Body as ReadableStream,
      destination: res,
    });

    return;
  },
);

export default uploadsRouter;
