import mongoose, { Schema, Model } from "mongoose";
import { ISPLocationTrackingSchema } from "../../types/schemaTypes";

const spLocationTrackingSchema: Schema<ISPLocationTrackingSchema> = new Schema(
  {
    spId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "towingservicebookings",
      required: true,
      index: true,
    },
    lastLocations: {
      type: [
        {
          lat: {
            type: Number,
          },
          lng: {
            type: Number,
          },
          timestamp: {
            type: Date,
            default: Date.now(),
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const SPLocationTrackingModel: Model<ISPLocationTrackingSchema> =
  mongoose.model<ISPLocationTrackingSchema>("spLocationTracking", spLocationTrackingSchema);
export default SPLocationTrackingModel;
