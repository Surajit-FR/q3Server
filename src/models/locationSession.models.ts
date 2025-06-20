import mongoose, { Schema, Model } from "mongoose";
import { ILocationSession } from "../../types/schemaTypes";

const locationSessionSchema = new Schema<ILocationSession>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    location: {
        type: String,
        default: "",
    },
    latitude: {
        type: String,
    },
    longitude: {
        type: String,
    },
    startedAt: {
        type: Date,
        default: Date.now,
    },
    endedAt: {
        type: Date,
    },
    duration: {
        type: Number,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    serviceDetails: [

        {
            serviceId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "towingServiceBooking",
            },
            serviceProgess: {
                type: String
            },
            serviceDistance: {
                type: Number
            }
        }

    ]
}, { timestamps: true });

const LocationSessionModel = mongoose.model<ILocationSession>(
    "LocationSession",
    locationSessionSchema
);

export default LocationSessionModel;