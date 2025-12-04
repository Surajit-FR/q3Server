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
exports.updateCustomRule = exports.fetchCustomPricingRule = exports.updatePricingRule = exports.fetchPricingRule = exports.addPricingRule = void 0;
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const response_utils_1 = require("../../utils/response.utils");
const pricingRule_model_1 = __importDefault(require("../models/pricingRule.model"));
const customPricingRule_model_1 = __importDefault(require("../models/customPricingRule.model"));
exports.addPricingRule = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: addPricingRule");
    const { baseFee, includedMiles, costPerMile, additionalFee } = req.body;
    //check for the duplicacy
    const existinfVehicleType = yield pricingRule_model_1.default.findOne({});
    if (existinfVehicleType) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "Pricing rule already exists.");
    }
    // Create and save the shift
    const newPricingRule = yield pricingRule_model_1.default.create({
        baseFee,
        includedMiles,
        costPerMile,
        additionalFee,
    });
    if (!newPricingRule) {
        return (0, response_utils_1.handleResponse)(res, "error", 500, "Something went wrong while adding the Shift.");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 201, newPricingRule, "Pricing rule added Successfully");
}));
exports.fetchPricingRule = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: fetchPricingRule");
    const results = yield pricingRule_model_1.default.find({});
    const responseData = results.length
        ? (0, response_utils_1.handleResponse)(res, "success", 200, results[0], "Pricing rule retrieved successfully.")
        : (0, response_utils_1.handleResponse)(res, "success", 200, "", "Pricing Rule not found.");
    return responseData;
}));
exports.updatePricingRule = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("API runs...: updatePricingRule");
    const { id } = req.params; // Rule ID
    const updateData = req.body;
    // Validate ID
    if (!id) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, null, "Pricing rule ID is required.");
    }
    // Find and update
    const updatedRule = yield pricingRule_model_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    // If rule not found
    if (!updatedRule) {
        return (0, response_utils_1.handleResponse)(res, "error", 404, null, "Pricing rule not found.");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, updatedRule, "Pricing rule updated successfully.");
}));
exports.fetchCustomPricingRule = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: fetchCustomePricingRule");
    const results = yield customPricingRule_model_1.default.find({});
    const responseData = results.length
        ? (0, response_utils_1.handleResponse)(res, "success", 200, results[0], "Custom rule retrieved successfully.")
        : (0, response_utils_1.handleResponse)(res, "success", 200, "", "Custom Rule not found.");
    return responseData;
}));
exports.updateCustomRule = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("API runs...: updateCustomRule");
    const { id } = req.params; // Rule ID
    const updateData = req.body;
    // Validate ID
    if (!id) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, null, "Custom rule ID is required.");
    }
    // Find and update
    const updatedRule = yield customPricingRule_model_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    // If rule not found
    if (!updatedRule) {
        return (0, response_utils_1.handleResponse)(res, "error", 404, null, "Custom rule not found.");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, updatedRule, "Custom rule updated successfully.");
}));
