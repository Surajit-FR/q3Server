"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const towingServiceBookingSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "user"
    },
    picklocation: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true, // [longitude, latitude]
        },
    },
    pickupLocation: {
        type: String,
    },
    destinyLocation: {
        type: String,
    },
    totalDistance: {
        type: String,
    },
    vehicleTypeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "vehicleType"
    },
    disputedVehicleImage: {
        type: String,
    },
    serviceSpecificNotes: {
        type: String,
    },
    isReqAccepted: {
        type: Boolean,
        default: false,
    },
    serviceProviderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "user",
        default: null
    },
    serviceProgess: {
        type: String,
        enum: ["Booked", "ServiceAccepted", "ServiceStarted", "ServiceCompleted", "ServiceDeclined", "ServiceCancelled"],
        default: "Booked"
    },
    startedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
//adding geospatial index
towingServiceBookingSchema.index({ picklocation: "2dsphere" });
const towingServiceBookingModel = mongoose_1.default.model('towingServiceBooking', towingServiceBookingSchema);
exports.default = towingServiceBookingModel;
