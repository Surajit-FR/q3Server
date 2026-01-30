"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomRule = exports.fetchCustomPricingRule = exports.updatePricingRule = exports.fetchPricingRule = exports.addPricingRule = void 0;
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const response_utils_1 = require("../../utils/response.utils");
const pricingRule_model_1 = __importDefault(require("../models/pricingRule.model"));
const customPricingRule_model_1 = __importDefault(require("../models/customPricingRule.model"));
exports.addPricingRule = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    console.log("Api runs...: addPricingRule");
    const { baseFee, includedMiles, costPerMile, additionalFee } = req.body;
    //check for the duplicacy
    const existinfVehicleType = await pricingRule_model_1.default.findOne({});
    if (existinfVehicleType) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "Pricing rule already exists.");
    }
    // Create and save the shift
    const newPricingRule = await pricingRule_model_1.default.create({
        baseFee,
        includedMiles,
        costPerMile,
        additionalFee,
    });
    if (!newPricingRule) {
        return (0, response_utils_1.handleResponse)(res, "error", 500, "Something went wrong while adding the Shift.");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 201, newPricingRule, "Pricing rule added Successfully");
});
exports.fetchPricingRule = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    console.log("Api runs...: fetchPricingRule");
    const results = await pricingRule_model_1.default.find({});
    const responseData = results.length
        ? (0, response_utils_1.handleResponse)(res, "success", 200, results[0], "Pricing rule retrieved successfully.")
        : (0, response_utils_1.handleResponse)(res, "success", 200, "", "Pricing Rule not found.");
    return responseData;
});
exports.updatePricingRule = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    console.log("API runs...: updatePricingRule");
    const { id } = req.params; // Rule ID
    const updateData = req.body;
    // Validate ID
    if (!id) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, null, "Pricing rule ID is required.");
    }
    // Find and update
    const updatedRule = await pricingRule_model_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    // If rule not found
    if (!updatedRule) {
        return (0, response_utils_1.handleResponse)(res, "error", 404, null, "Pricing rule not found.");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, updatedRule, "Pricing rule updated successfully.");
});
exports.fetchCustomPricingRule = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    console.log("Api runs...: fetchCustomePricingRule");
    const results = await customPricingRule_model_1.default.find({});
    const responseData = results.length
        ? (0, response_utils_1.handleResponse)(res, "success", 200, results[0], "Custom rule retrieved successfully.")
        : (0, response_utils_1.handleResponse)(res, "success", 200, "", "Custom Rule not found.");
    return responseData;
});
exports.updateCustomRule = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    console.log("API runs...: updateCustomRule");
    const { id } = req.params; // Rule ID
    const updateData = req.body;
    // Validate ID
    if (!id) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, null, "Custom rule ID is required.");
    }
    // Find and update
    const updatedRule = await customPricingRule_model_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    // If rule not found
    if (!updatedRule) {
        return (0, response_utils_1.handleResponse)(res, "error", 404, null, "Custom rule not found.");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, updatedRule, "Custom rule updated successfully.");
});
