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
        $project: {
          password: 0,
          stripeCustomerId: 0,
          accessToken: 0,
          fcmToken: 0,
          __v: 0,
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
    const {
      page = 1,
      limit = 10,
      query = "",
      sortBy = "createdAt",
      sortType = "desc",
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const searchQuery = query
      ? {
          $or: [
            { fullName: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
            { phone: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const matchCriteria = {
      isDeleted: false,
      userType: "Customer",
      ...searchQuery,
    };

    const sortCriteria: any = {};
    sortCriteria[sortBy as string] = sortType === "desc" ? -1 : 1;

    console.log("Api runs...: getAllCustomer");

    const customersDetails = await UserModel.aggregate([
      {
        $match: matchCriteria,
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
      { $sort: sortCriteria },
      { $skip: (pageNumber - 1) * limitNumber },
      { $limit: limitNumber },
    ]);
    const totalRecords = await UserModel.countDocuments(matchCriteria);

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
      {
        customers: customersDetails,
        pagination: {
          total: totalRecords,
          page: pageNumber,
          limit: limitNumber,
        },
      },
      "Customers fetched successfully"
    );
  }
);

export const getAllProviders = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: getAllProviders");

    const {
      page = 1,
      limit = 10,
      query = "",
      sortBy = "createdAt",
      sortType = "desc",
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const searchQuery = query
      ? {
          $or: [
            { fullName: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
            { phone: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const matchCriteria = {
      isDeleted: false,
      userType: "ServiceProvider",
      ...searchQuery,
    };

    const sortCriteria: any = {};
    sortCriteria[sortBy as string] = sortType === "desc" ? -1 : 1;

    const providersDetails = await UserModel.aggregate([
      {
        $match: matchCriteria,
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
      { $sort: sortCriteria },
      { $skip: (pageNumber - 1) * limitNumber },
      { $limit: limitNumber },
    ]);
    const totalRecords = await UserModel.countDocuments(matchCriteria);

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
      {
        serviceProviders: providersDetails,
        pagination: {
          total: totalRecords,
          page: pageNumber,
          limit: limitNumber,
        },
      },
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
