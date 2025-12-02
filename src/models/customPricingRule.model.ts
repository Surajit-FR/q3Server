import mongoose, { Schema, Model } from "mongoose";
import { IServiceCustomPricingRule } from "../../types/schemaTypes";

const customPricingSchema: Schema<IServiceCustomPricingRule> = new Schema(
  {
    appliesToVehicleType: {
      type: String,
      enum: ["Truck"],
      default: "Truck",
    },
    instructions: {
      type: String,
      default:
        "Call for heavy vehicle rates. Pricing varies depending on weight",
    },
    contactNumber: {
      type: String,
      default: "+14567891235",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const CustomPricingModel: Model<IServiceCustomPricingRule> = mongoose.model(
  "customPricing",
  customPricingSchema
);

export default CustomPricingModel;
