"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRating = void 0;
const rating_model_1 = __importDefault(require("../models/rating.model"));
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const response_utils_1 = require("../../utils/response.utils");
// addRating controller
exports.addRating = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    var _a, _b, _c;
    console.log("Api runs...: addRating");
    const { rating, ratedTo, serviceId, comments } = req.body;
    console.log("addRating", (_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
    // Validate required fields
    if (!rating || !ratedTo) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, {}, "At least some rating required");
    }
    const existingRating = await rating_model_1.default.find({
        ratedBy: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
        ratedTo,
        serviceId,
    });
    console.log({ existingRating });
    if (existingRating.length > 0) {
        return (0, response_utils_1.handleResponse)(res, "error", 409, existingRating[0], "You have already rated this SP for this servive");
    }
    // Create a rating
    const newrating = new rating_model_1.default({
        ratedBy: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
        ratedTo,
        serviceId,
        rating,
        comments,
    });
    // Save the rating to the database
    const savedRating = await newrating.save();
    return (0, response_utils_1.handleResponse)(res, "success", 200, savedRating, "Rating submitted successfully");
});
