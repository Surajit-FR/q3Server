import { Request, Response } from "express";
import SPLocationTrackingModel from "../models/spLocationTracking.model";
import { asyncHandler } from "../../utils/asyncHandler.utils";
import { handleResponse } from "../../utils/response.utils";
import { CustomRequest } from "../../types/commonType";

export const updateSPLocation = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { spId = req.user._id, serviceId, lat, lng } = req.body;

    if (!spId || !serviceId || !lat || !lng) {
      return res.status(400).json({
        status: "error",
        message: "Required fields missing",
      });
    }

    const newPoint = {
      lat,
      lng,
      timestamp: new Date(),
    };

    const updatedDoc = await SPLocationTrackingModel.findOneAndUpdate(
      { spId, serviceId },
      {
        $push: {
          lastLocations: {
            $each: [newPoint],
            $slice: -2, // only last 2 locations kept
          },
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
    return handleResponse(
      res,
      "success",
      200,
      updatedDoc,
      "SP location updated"
    );
  }
);

export const getSPLocation = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { serviceId } = req.params;

    const locationRecord = await SPLocationTrackingModel.findOne({
      serviceId,
      spId: req.user?._id,
    }).lean();

    if (!locationRecord) {
      return res.status(404).json({
        status: "error",
        message: "Location not found",
      });
    }

    return handleResponse(
      res,
      "success",
      200,
      locationRecord.lastLocations,
      "SP location fetched successfully"
    );
  }
);
