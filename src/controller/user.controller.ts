import { Request, Response } from "express";
import UserModel from "../models/user.model";
import mongoose, { ObjectId } from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.utils";
import { handleResponse } from "../../utils/response.utils";
import { CustomRequest } from "../../types/commonType";
import RatingModel from "../models/spRatings.model";
import towingServiceBookingModel from "../models/towingServiceBooking.model";
import AdditionalInfoModel from "../models/additionalInfo.model";
import LocationSessionModel from "../models/locationSession.models";

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
          from: "locationsessions",
          foreignField: "userId",
          localField: "_id",
          as: "sp_location_details",
          pipeline: [
            {
              $match: {
                isActive: true,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$sp_location_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "additionalinfos",
          foreignField: "userId",
          localField: "_id",
          as: "sp_details",
        },
      },
      {
        $unwind: {
          path: "$sp_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "towingservicebookings",
          foreignField: "serviceProviderId",
          localField: "_id",
          as: "sp_engagement_details",
          pipeline: [
            {
              $match: {
                serviceProgess: {
                  $nin: [
                    "ServiceCompleted",
                    "ServiceCancelledBySP",
                    "ServiceCancelledByCustomer",
                  ],
                },
              },
            },
          ],
        },
      },
      // {
      //   $unwind: {
      //     path: "$sp_engagement_details",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      {
        $addFields: {
          isOnline: { $ifNull: ["$sp_location_details", false] },
          isEngaged: { $ifNull: ["$sp_engagement_details", false] },
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
          sp_engagement_details: 0,
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
      "User fetched successfully",
    );
  },
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
        $lookup: {
          from: "towingservicebookings",
          foreignField: "userId",
          localField: "_id",
          as: "bookedService",
        },
      },
      {
        $addFields: {
          totalBookedServices: { $size: "$bookedService" },
        },
      },

      {
        $project: {
          password: 0,
          bookedService: 0,
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
        "Customers not found",
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
      "Customers fetched successfully",
    );
  },
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
          from: "towingservicebookings",
          foreignField: "serviceProviderId",
          localField: "_id",
          as: "bookedService",
        },
      },
      {
        $addFields: {
          totalBookedServices: { $size: "$bookedService" },
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
          bookedService: 0,
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
        "Providers not found",
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
      "Providers fetched successfully",
    );
  },
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
        "Rating submitted successfully",
      );
    }
    return handleResponse(
      res,
      "success",
      201,
      savedRating,
      "Error in add rating",
    );
  },
);

//update sp data
export const updateSp = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: updateSp");

    const spId = req.user?._id;

    const ongoingServices = await towingServiceBookingModel.aggregate([
      {
        $match: {
          serviceProviderId: spId,
          serviceProgess: {
            $nin: [
              "ServiceCompleted",
              "ServiceCancelledBySP",
              "ServiceCancelledByCustomer",
            ],
          },
        },
      },
    ]);

    if (ongoingServices.length > 0) {
      return handleResponse(
        res,
        "error",
        400,
        {},
        "Cannot update while performing the service",
      );
    }

    const {
      fullName,
      avatar,
      driverLicense,
      driverLicenseImage,
      insuranceNumber,
      insuranceImage,
    } = req.body;

    let isUpdated = false;

    if (fullName || avatar) {
      const userUpdate = await UserModel.findByIdAndUpdate(
        spId,
        {
          $set: {
            ...(fullName && { fullName }),
            ...(avatar && { avatar }),
          },
        },
        { runValidators: true },
      );

      if (userUpdate) isUpdated = true;
    }

    if (
      driverLicense ||
      driverLicenseImage ||
      insuranceNumber ||
      insuranceImage
    ) {
      const additionalUpdate = await AdditionalInfoModel.updateOne(
        { serviceProviderId: spId },
        {
          $set: {
            ...(driverLicense && { driverLicense }),
            ...(driverLicenseImage && { driverLicenseImage }),
            ...(insuranceNumber && { insuranceNumber }),
            ...(insuranceImage && { insuranceImage }),
          },
        },
        { runValidators: true },
      );

      if (additionalUpdate.modifiedCount > 0) isUpdated = true;
    }

    if (isUpdated) {
      await UserModel.updateOne({ _id: spId }, { $set: { isVerified: false } });
    }

    return handleResponse(
      res,
      "success",
      200,
      {},
      "Service provider updated successfully",
    );
  },
);

export const updateCustomer = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: updateSp");
    const { fullName, avatar } = req.body;
    const updateCustomer = await UserModel.findOneAndUpdate(
      {
        _id: req.user?._id,
      },
      {
        $set: {
          fullName,
          avatar,
        },
      },
      {
        new: true,
      },
    );
    return handleResponse(res, "success", 200, "User updated successfully");
  },
);

export const getCardValue = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const totalCustomer = await UserModel.find({
      userType: "Customer",
    }).countDocuments();
    const totalSps = await UserModel.find({
      userType: "ServiceProvider",
    }).countDocuments();
    const totalServices = await towingServiceBookingModel
      .find({})
      .countDocuments();
    const totalActiveSps = await LocationSessionModel.find({
      isActive: true,
    }).countDocuments();

    return handleResponse(
      res,
      "success",
      200,
      { totalCustomer, totalSps, totalServices, totalActiveSps },
      "KPI card values fetched successfully",
    );
  },
);

export const fetchAllActiveSps = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const activeSps = await LocationSessionModel.find({ isActive: true });
    return handleResponse(
      res,
      "success",
      200,
      activeSps,
      "All active sps fetched successfully",
    );
  },
);
