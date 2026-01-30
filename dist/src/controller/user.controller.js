"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllActiveSps = exports.getCardValue = exports.updateCustomer = exports.updateSp = exports.giveRating = exports.getAllProviders = exports.getAllCustomer = exports.getSingleUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const response_utils_1 = require("../../utils/response.utils");
const spRatings_model_1 = __importDefault(require("../models/spRatings.model"));
const towingServiceBooking_model_1 = __importDefault(require("../models/towingServiceBooking.model"));
const additionalInfo_model_1 = __importDefault(require("../models/additionalInfo.model"));
const locationSession_models_1 = __importDefault(require("../models/locationSession.models"));
exports.getSingleUser = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    console.log("Api runs...: getSingleUser");
    const { userId } = req.query;
    if (!userId) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "User ID is required");
    }
    const userData = await user_model_1.default.aggregate([
        {
            $match: {
                _id: new mongoose_1.default.Types.ObjectId(userId),
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
        return (0, response_utils_1.handleResponse)(res, "success", 200, userData, "User not found");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, userData, "User fetched successfully");
});
exports.getAllCustomer = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    console.log("Api runs...: getAllCustomer");
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const searchQuery = query
        ? {
            $or: [
                { fullName: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
                { phone: { $regex: query, $options: "i" } },
            ],
        }
        : {};
    const matchCriteria = Object.assign({ isDeleted: false, userType: "Customer" }, searchQuery);
    const sortCriteria = {};
    sortCriteria[sortBy] = sortType === "desc" ? -1 : 1;
    console.log("Api runs...: getAllCustomer");
    const customersDetails = await user_model_1.default.aggregate([
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
    const totalRecords = await user_model_1.default.countDocuments(matchCriteria);
    if (customersDetails.length == 0) {
        return (0, response_utils_1.handleResponse)(res, "success", 200, customersDetails, "Customers not found");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, {
        customers: customersDetails,
        pagination: {
            total: totalRecords,
            page: pageNumber,
            limit: limitNumber,
        },
    }, "Customers fetched successfully");
});
exports.getAllProviders = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    console.log("Api runs...: getAllProviders");
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const searchQuery = query
        ? {
            $or: [
                { fullName: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
                { phone: { $regex: query, $options: "i" } },
            ],
        }
        : {};
    const matchCriteria = Object.assign({ isDeleted: false, userType: "ServiceProvider" }, searchQuery);
    const sortCriteria = {};
    sortCriteria[sortBy] = sortType === "desc" ? -1 : 1;
    const providersDetails = await user_model_1.default.aggregate([
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
    const totalRecords = await user_model_1.default.countDocuments(matchCriteria);
    if (providersDetails.length == 0) {
        return (0, response_utils_1.handleResponse)(res, "success", 200, providersDetails, "Providers not found");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, {
        serviceProviders: providersDetails,
        pagination: {
            total: totalRecords,
            page: pageNumber,
            limit: limitNumber,
        },
    }, "Providers fetched successfully");
});
// giveRating controller for customer
exports.giveRating = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    var _a;
    console.log("Api runs...: giveRating");
    const { rating, ratedTo, comments } = req.body;
    if (!rating && !ratedTo) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "At least some rating required");
    }
    // Create a rating
    const newrating = new spRatings_model_1.default({
        ratedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
        ratedTo: new mongoose_1.default.Types.ObjectId(ratedTo),
        rating,
        comments,
    });
    // Save the rating to the database
    const savedRating = await newrating.save();
    if (savedRating) {
        return (0, response_utils_1.handleResponse)(res, "success", 201, savedRating, "Rating submitted successfully");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 201, savedRating, "Error in add rating");
});
//update sp data
exports.updateSp = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    var _a;
    console.log("Api runs...: updateSp");
    const spId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const ongoingServices = await towingServiceBooking_model_1.default.aggregate([
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
        return (0, response_utils_1.handleResponse)(res, "error", 400, {}, "Cannot update while performing the service");
    }
    const { fullName, avatar, driverLicense, driverLicenseImage, insuranceNumber, insuranceImage, } = req.body;
    let isUpdated = false;
    if (fullName || avatar) {
        const userUpdate = await user_model_1.default.findByIdAndUpdate(spId, {
            $set: Object.assign(Object.assign({}, (fullName && { fullName })), (avatar && { avatar })),
        }, { runValidators: true });
        if (userUpdate)
            isUpdated = true;
    }
    if (driverLicense ||
        driverLicenseImage ||
        insuranceNumber ||
        insuranceImage) {
        const additionalUpdate = await additionalInfo_model_1.default.updateOne({ serviceProviderId: spId }, {
            $set: Object.assign(Object.assign(Object.assign(Object.assign({}, (driverLicense && { driverLicense })), (driverLicenseImage && { driverLicenseImage })), (insuranceNumber && { insuranceNumber })), (insuranceImage && { insuranceImage })),
        }, { runValidators: true });
        if (additionalUpdate.modifiedCount > 0)
            isUpdated = true;
    }
    if (isUpdated) {
        await user_model_1.default.updateOne({ _id: spId }, { $set: { isVerified: false } });
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, {}, "Service provider updated successfully");
});
exports.updateCustomer = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    var _a;
    console.log("Api runs...: updateSp");
    const { fullName, avatar } = req.body;
    const updateCustomer = await user_model_1.default.findOneAndUpdate({
        _id: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
    }, {
        $set: {
            fullName,
            avatar,
        },
    }, {
        new: true,
    });
    return (0, response_utils_1.handleResponse)(res, "success", 200, "User updated successfully");
});
exports.getCardValue = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    const totalCustomer = await user_model_1.default.find({
        userType: "Customer", isDeleted: false
    }).countDocuments();
    const totalSps = await user_model_1.default.find({
        userType: "ServiceProvider", isDeleted: false
    }).countDocuments();
    const totalServices = await towingServiceBooking_model_1.default
        .find({ isDeleted: false })
        .countDocuments();
    const totalActiveSps = await locationSession_models_1.default.find({
        isActive: true,
    }).countDocuments();
    return (0, response_utils_1.handleResponse)(res, "success", 200, { totalCustomer, totalSps, totalServices, totalActiveSps }, "KPI card values fetched successfully");
});
exports.fetchAllActiveSps = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    const activeSps = await locationSession_models_1.default.find({ isActive: true });
    return (0, response_utils_1.handleResponse)(res, "success", 200, activeSps, "All active sps fetched successfully");
});
