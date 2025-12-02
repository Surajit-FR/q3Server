import mongoose, { Schema, Model } from "mongoose";
import { IServicePricingRule } from "../../types/schemaTypes";

const pricingRuleSchema: Schema<IServicePricingRule> = new Schema(
  {
    baseFee: {
      type: Number,
      required: true,
    },
    includedMiles: {
      type: Number,
      required: true,
    },
    costPerMile: {
      type: Number,
      required: true,
    },
    additionalFee: {
      type: Number,
      default: 0,
    },
    isDeleted:{
      type:Boolean,
      default:false
    }
  },
  { timestamps: true }
);

const PricingRuleModel: Model<IServicePricingRule> = mongoose.model(
  "pricingRule",
  pricingRuleSchema
);

export default PricingRuleModel;
