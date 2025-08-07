import { Request, Response } from "express";
import UserModel from "../models/user.model";
import mongoose, { ObjectId } from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.utils";
import { handleResponse } from "../../utils/response.utils";
import { CustomRequest } from "../../types/commonType";
import RatingModel from "../models/spRatings.model";

export const getSingleUser = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: getSingleUser");

    const { userId } = req.query;

    if (!userId) {
      return handleResponse(res, "error", 400, "", "User ID is required");
    }

    const userData = await UserModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId as string),
        },
      },
      {
        $lookup: {
          from: "additionalinfos",
          foreignField: "userId",
          localField: "_id",
          as: "additionalInfo",
        },
      },
      {
        $unwind: {
          preserveNullAndEmptyArrays: true,
          path: "$additionalInfo",
        },
      },
      {
        $project: {
          password: 0,
          stripeCustomerId: 0,
          accessToken: 0,
          fcmToken: 0,
          __v: 0,
          dob: 0,
          "additionalInfo.__v": 0,
        },
      },
    ]);

    if (userData.length == 0) {
      return handleResponse(res, "success", 200, userData, "User not found");
    }
    return handleResponse(
      res,
      "success",
      200,
      userData,
      "User fetched successfully"
    );
  }
);

export const getAllCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: getAllCustomer");

    const customersDetails = await UserModel.aggregate([
      {
        $match: {
          isDeleted: false,
          userType: "Customer",
        },
      },

      {
        $project: {
          password: 0,
          stripeCustomerId: 0,
          accessToken: 0,
          fcmToken: 0,
          __v: 0,
        },
      },
    ]);

    if (customersDetails.length == 0) {
      return handleResponse(
        res,
        "success",
        200,
        customersDetails,
        "Customers not found"
      );
    }
    return handleResponse(
      res,
      "success",
      200,
      customersDetails,
      "Customers fetched successfully"
    );
  }
);

export const getAllProviders = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: getAllProviders");

    const providersDetails = await UserModel.aggregate([
      {
        $match: {
          isDeleted: false,
          userType: "ServiceProvider",
        },
      },
      {
        $lookup: {
          from: "additionalinfos",
          foreignField: "userId",
          localField: "_id",
          as: "additionalInfo",
        },
      },
      {
        $unwind: {
          preserveNullAndEmptyArrays: true,
          path: "$additionalInfo",
        },
      },
      {
        $project: {
          password: 0,
          stripeCustomerId: 0,
          accessToken: 0,
          fcmToken: 0,
          __v: 0,
          "additionalInfo.__v": 0,
        },
      },
    ]);

    if (providersDetails.length == 0) {
      return handleResponse(
        res,
        "success",
        200,
        providersDetails,
        "Providers not found"
      );
    }

    return handleResponse(
      res,
      "success",
      200,
      providersDetails,
      "Providers fetched successfully"
    );
  }
);

// giveRating controller for customer
export const giveRating = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: giveRating");

    const { rating, ratedTo, comments } = req.body;

    if (!rating && !ratedTo) {
      return handleResponse(res, "error", 400, "At least some rating required");
    }

    // Create a rating
    const newrating = new RatingModel({
      ratedBy: req.user?._id,
      ratedTo: new mongoose.Types.ObjectId(ratedTo),
      rating,
      comments,
    });


    // Save the rating to the database
    const savedRating = await newrating.save();
    if (savedRating) {
      return handleResponse(
        res,
        "success",
        201,
        savedRating,
        "Rating submitted successfully"
      );
    }
    return handleResponse(
      res,
      "success",
      201,
      savedRating,
      "Error in add rating"
    );
  }
);


