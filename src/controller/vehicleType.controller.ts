import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.utils";
import { CustomRequest } from "../../types/commonType";
import { handleResponse } from "../../utils/response.utils";
import vehicleTypeModel from "../models/vehicleType.model";

// addVehicleType controller
export const addVehicleType = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: addVehicleType");

    // console.log("api hits");

    const { type, image, totalSeat } = req.body;

    //check for the duplicacy
    const existinfVehicleType = await vehicleTypeModel.findOne({ type });

    if (existinfVehicleType) {
      return handleResponse(
        res,
        "error",
        400,
        "Vehicle type with the same name already exists."
      );
    }

    // Create and save the shift
    const newVehicleType = await vehicleTypeModel.create({
      type,
      image,
      totalSeat,
    });

    if (!newVehicleType) {
      return handleResponse(
        res,
        "error",
        500,
        "Something went wrong while adding the Shift."
      );
    }

    return handleResponse(
      res,
      "success",
      201,
      newVehicleType,
      "Vehicle type added Successfully"
    );
  }
);

// fetchVehicleTypebyId controller
export const fetchVehicleTypebyId = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: fetchVehicleTypebyId");

    const { VehicleTypeId } = req.params;
    // console.log({VehicleTypeId});

    const results = await vehicleTypeModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(VehicleTypeId),
        },
      },
      {
        $project: {
          isDeleted: 0,
          __v: 0,
        },
      },
    ]);
    const responseData = results.length
      ? handleResponse(
          res,
          "success",
          200,
          results[0],
          "Vehicle type retrieved successfully."
        )
      : handleResponse(res, "success", 200, "", "Vehicle type not found.");
    return responseData;
  }
);

// fetchVehicleTypes controller
export const fetchVehicleTypes = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: fetchVehicleTypes");

    const results = await vehicleTypeModel.aggregate([
      { $match: { isDeleted: false } },
    ]);
    if (results.length) {
      return handleResponse(
        res,
        "success",
        200,
        results,
        "Vehicle types retrieved successfully."
      );
    } else {
      return handleResponse(res, "success", 200, "", "Vehicle type not found.");
    }
  }
);
