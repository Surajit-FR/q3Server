import { Response } from "express";
import { CustomRequest } from "../../types/commonType";
import RatingModel from "../models/rating.model";
import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.utils";
import { handleResponse } from "../../utils/response.utils";

// addRating controller
export const addRating = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { rating, ratedTo, serviceId, comments } = req.body;

    // Validate required fields
    if (!rating || !ratedTo) {
      return handleResponse(
        res,
        "error",
        400,
        {},
        "At least some rating required",
      );
    }

    const existingRating = await RatingModel.find({
      ratedBy: req.user?._id,
      ratedTo,
      serviceId,
    });
    console.log({ existingRating });

    if (existingRating.length > 0) {
      return handleResponse(
        res,
        "error",
        409,
        existingRating[0],
        "You have already rated this SP for this servive",
      );
    }

    // Create a rating
    const newrating = new RatingModel({
      ratedBy: req.user?._id,
      ratedTo,
      serviceId,
      rating,
      comments,
    });

    // Save the rating to the database
    const savedRating = await newrating.save();
    return handleResponse(
      res,
      "success",
      200,
      savedRating,
      "Rating submitted successfully",
    );
  },
);

// export
