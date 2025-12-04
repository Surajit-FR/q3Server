import mongoose, { Schema, Model } from "mongoose";
import { ITowingServiceBookingSchema } from "../../types/schemaTypes";

const towingServiceBookingSchema: Schema<ITowingServiceBookingSchema> =
  new Schema(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
      isCurrentLocationforPick: {
        type: Boolean,
        default: false,
      },
      picklocation: {
        type: {
          type: String,
          enum: ["Point"],
          required: true,
          default: "Point",
        },
        coordinates: {
          type: [Number],
          required: true, // [longitude, latitude]
        },
      },
      pickupLocation: {
        type: String,
      },
      placeId_pickup: {
        type: String,
      },
      placeId_destination: {
        type: String,
      },
      destinyLocation: {
        type: String,
      },
      totalDistance: {
        type: String,
      },
      vehicleTypeId: {
        type: Schema.Types.ObjectId,
        ref: "vehicleType",
      },
      disputedVehicleImage: {
        type: String,
      },
      providerVehicleDetails: {
        type: {
          type: String,
        },
        number: {
          type: String,
        },
        modelName: {
          type: String,
        },
        driverName: {
          type: String,
        },
        driverImage: {
          type: String,
        },
        driverNumber: {
          type: String,
        },
      },
      serviceSpecificNotes: {
        type: String,
      },
      isReqAccepted: {
        type: Boolean,
        default: false,
      },
      serviceProviderId: {
        type: Schema.Types.ObjectId,
        ref: "user",
        default: null,
      },
      serviceProgess: {
        type: String,
        enum: [
          "Booked",
          "ServiceExpired",
          "ServiceAccepted",
          "ServiceStarted",
          "ServiceCompleted",
          "ServiceCancelledBySP",
          "ServiceCancelledByCustomer",
        ],
        default: "Booked",
      },
      startedAt: {
        type: Date,
        default: null,
      },
      completedAt: {
        type: Date,
        default: null,
      },
      declinedBy: {
        type: [String],
        default: [],
      },
      isDeleted: {
        type: Boolean,
        default: false,
      },
      isCustomPricing: {
        type: Boolean,
        default: false,
      },
      pricing: {
        type: {
          baseFee: {
            type: Number,
            required: true,
          },
          includedMiles: {
            type: Number,
            required: true,
          },
          extraMiles: {
            type: Number,
          },
          costPerMile: {
            type: Number,
          },
          additionalFee: {
            type: Number,
            default: 0,
          },
          total: {
            type: Number,
            default: 0,
          },
        },
      },
      isPaymentComplete: {
        type: Boolean,
        default: false,
      },
      paymentIntentId: {
        type: String,
      },
      serviceCode: {
        type: Number,
      },
    },
    { timestamps: true }
  );

//adding geospatial index
towingServiceBookingSchema.index({ picklocation: "2dsphere" });

const towingServiceBookingModel: Model<ITowingServiceBookingSchema> =
  mongoose.model<ITowingServiceBookingSchema>(
    "towingServiceBooking",
    towingServiceBookingSchema
  );
export default towingServiceBookingModel;
