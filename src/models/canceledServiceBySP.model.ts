import mongoose, { Schema, Model } from "mongoose";
import { ICanceledServiceBySP } from "../../types/schemaTypes";

const CancelServiceBySPSchema: Schema<ICanceledServiceBySP> = new Schema(
  {
    costumerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    spId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "towingServiceBooking",
    },
    progressBeforeCancel: {
      type: String,
      enum: ["ServiceAccepted", "ServiceStarted", "ServiceCompleted"],
    },
    reason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CancelServiceBySPModel = mongoose.model<ICanceledServiceBySP>(
  "CanceledServiceBySP",
  CancelServiceBySPSchema
);
