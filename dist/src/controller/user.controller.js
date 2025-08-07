"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.giveRating = exports.getAllProviders = exports.getAllCustomer = exports.getSingleUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const response_utils_1 = require("../../utils/response.utils");
const spRatings_model_1 = __importDefault(require("../models/spRatings.model"));
exports.getSingleUser = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: getSingleUser");
    const { userId } = req.query;
    if (!userId) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "User ID is required");
    }
    const userData = yield user_model_1.default.aggregate([
        {
            $match: {
                _id: new mongoose_1.default.Types.ObjectId(userId),
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
        return (0, response_utils_1.handleResponse)(res, "success", 200, userData, "User not found");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, userData, "User fetched successfully");
}));
exports.getAllCustomer = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const customersDetails = yield user_model_1.default.aggregate([
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
    const totalRecords = yield user_model_1.default.countDocuments(matchCriteria);
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
}));
exports.getAllProviders = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const providersDetails = yield user_model_1.default.aggregate([
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
    const totalRecords = yield user_model_1.default.countDocuments(matchCriteria);
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
}));
// giveRating controller for customer
exports.giveRating = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const savedRating = yield newrating.save();
    if (savedRating) {
        return (0, response_utils_1.handleResponse)(res, "success", 201, savedRating, "Rating submitted successfully");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 201, savedRating, "Error in add rating");
}));
