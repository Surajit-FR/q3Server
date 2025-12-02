import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.utils";
import { CustomRequest } from "../../types/commonType";
import { handleResponse } from "../../utils/response.utils";
import PricingRuleModel from "../models/pricingRule.model";
import CustomPricingModel from "../models/customPricingRule.model";

export const addPricingRule = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: addPricingRule");

    const { baseFee, includedMiles, costPerMile, additionalFee } = req.body;

    //check for the duplicacy
    const existinfVehicleType = await PricingRuleModel.findOne({ });

    if (existinfVehicleType) {
      return handleResponse(
        res,
        "error",
        400,
        "Pricing rule already exists."
      );
    }

    // Create and save the shift
    const newPricingRule = await PricingRuleModel.create({
      baseFee,
      includedMiles,
      costPerMile,
      additionalFee,
    });

    if (!newPricingRule) {
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
      newPricingRule,
      "Pricing rule added Successfully"
    );
  }
);

export const fetchPricingRule = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: fetchPricingRule");


    const results = await PricingRuleModel.find({})
    
    const responseData = results.length
      ? handleResponse(
          res,
          "success",
          200,
          results[0],
          "Pricing rule retrieved successfully."
        )
      : handleResponse(res, "success", 200, "", "Pricing Rule not found.");
    return responseData;
  }
);

export const updatePricingRule = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("API runs...: updatePricingRule");

    const { id } = req.params; // Rule ID
    const updateData = req.body;

    // Validate ID
    if (!id) {
      return handleResponse(res, "error", 400, null, "Pricing rule ID is required.");
    }

    // Find and update
    const updatedRule = await PricingRuleModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // If rule not found
    if (!updatedRule) {
      return handleResponse(res, "error", 404, null, "Pricing rule not found.");
    }

    return handleResponse(
      res,
      "success",
      200,
      updatedRule,
      "Pricing rule updated successfully."
    );
  }
);

export const fetchCustomPricingRule = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: fetchCustomePricingRule");


    const results = await CustomPricingModel.find({})
    
    const responseData = results.length
      ? handleResponse(
          res,
          "success",
          200,
          results[0],
          "Custom rule retrieved successfully."
        )
      : handleResponse(res, "success", 200, "", "Custom Rule not found.");
    return responseData;
  }
);

export const updateCustomRule = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("API runs...: updateCustomRule");

    const { id } = req.params; // Rule ID
    const updateData = req.body;

    // Validate ID
    if (!id) {
      return handleResponse(res, "error", 400, null, "Custom rule ID is required.");
    }

    // Find and update
    const updatedRule = await CustomPricingModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // If rule not found
    if (!updatedRule) {
      return handleResponse(res, "error", 404, null, "Custom rule not found.");
    }

    return handleResponse(
      res,
      "success",
      200,
      updatedRule,
      "Custom rule updated successfully."
    );
  }
);



