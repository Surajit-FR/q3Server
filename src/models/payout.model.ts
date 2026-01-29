import { Schema, model } from "mongoose";

const payoutSchema = new Schema(
  {
    serviceProviderId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: true,
    },

    serviceId: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "usd",
    },

    stripeAccountId: {
      type: String,
      required: true,
    },

    transferId: {
      type: String,
      required: true,
    },

    payoutId: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "paid",
    },


  },
  { timestamps: true },
);

export default model("Payout", payoutSchema);
