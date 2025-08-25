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
exports.getSavedDestination = exports.handleServiceRequestState = exports.acceptServiceRequest = exports.declineServicerequest = exports.fetchTowingServiceRequest = exports.bookTowingService = void 0;
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
5;
const response_utils_1 = require("../../utils/response.utils");
const towingServiceBooking_model_1 = __importDefault(require("../models/towingServiceBooking.model"));
const googleapis_controller_1 = require("./googleapis.controller");
const locationSession_models_1 = __importDefault(require("../models/locationSession.models"));
const mongoose_1 = __importDefault(require("mongoose"));
// addVehicleType controller
exports.bookTowingService = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Api runs...: bookTowingService");
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { pickupLocation, destinyLocation, vehicleTypeId, disputedVehicleImage, serviceSpecificNotes, totalDistance, pickupLat, pickuplong, } = req.body;
    if (!pickupLocation)
        return (0, response_utils_1.handleResponse)(res, "error", 400, "pickupLocation is required.");
    if (!destinyLocation)
        return (0, response_utils_1.handleResponse)(res, "error", 400, "destinyLocation is required.");
    if (!vehicleTypeId)
        return (0, response_utils_1.handleResponse)(res, "error", 400, "vehicleTypeId is required.");
    if (!disputedVehicleImage)
        return (0, response_utils_1.handleResponse)(res, "error", 400, "disputedVehicleImage is required.");
    if (!serviceSpecificNotes)
        return (0, response_utils_1.handleResponse)(res, "error", 400, "serviceSpecificNotes is required.");
    const picklocation = {
        type: "Point",
        coordinates: [pickuplong, pickupLat], // [longitude, latitude]
    };
    const distance = yield (0, googleapis_controller_1.getDistanceInKm)(pickupLocation, destinyLocation);
    // // Create and save the shift
    const newBooking = yield towingServiceBooking_model_1.default.create({
        pickupLocation,
        destinyLocation,
        vehicleTypeId,
        disputedVehicleImage,
        serviceSpecificNotes,
        userId,
        totalDistance: distance,
        picklocation,
    });
    if (!newBooking) {
        return (0, response_utils_1.handleResponse)(res, "error", 500, "Something went wrong while booking.");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 201, newBooking, "Booking Successfully");
}));
exports.fetchTowingServiceRequest = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    console.log("Api runs...: fetchTowingServiceRequest");
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
    let serviceProviderId;
    let address;
    address = yield locationSession_models_1.default.findOne({ userId, isActive: true });
    console.log({ address });
    if (!address || !address.longitude || !address.latitude) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "SP's location not found.");
    }
    const longitude = address.longitude;
    const latitude = address.latitude;
    // Extract coordinates and validate
    const serviceProviderLongitude = parseFloat(longitude);
    const serviceProviderLatitude = parseFloat(latitude);
    if (isNaN(serviceProviderLongitude) || isNaN(serviceProviderLatitude)) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "Invalid longitude or latitude");
    }
    const radius = 25000; // in meters
    const serviceRequests = yield towingServiceBooking_model_1.default.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [serviceProviderLongitude, serviceProviderLatitude],
                },
                distanceField: "distance",
                spherical: true,
                maxDistance: radius,
            },
        },
        {
            $addFields: {
                distance: { $ceil: "$distance" },
            },
        },
        {
            $match: {
                isDeleted: false,
                isReqAccepted: false,
                declinedBy: { $ne: String(userId) },
                $or: [
                    { serviceProgess: "ServiceCancelledBySP" },
                    { serviceProgess: "Booked" },
                ],
            },
        },
        {
            $project: {
                _id: 1,
                userId: 1,
                isDeleted: 1,
                createdAt: 1,
                latitude: 1,
                location: 1,
                longitude: 1,
                distance: 1,
                serviceProgess: 1,
            },
        },
    ]);
    if (!serviceRequests.length) {
        return (0, response_utils_1.handleResponse)(res, "success", 200, serviceRequests, "No nearby service request found");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, serviceRequests, "Service requests fetched successfully");
}));
//decline service request by sp
exports.declineServicerequest = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Api runs...: declineServicerequest");
    const { serviceId } = req.body;
    const spId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const declineService = yield towingServiceBooking_model_1.default.findOneAndUpdate({
        _id: new mongoose_1.default.Types.ObjectId(serviceId),
    }, {
        $push: { declinedBy: spId },
    }, {
        new: true,
    });
    return (0, response_utils_1.handleResponse)(res, "success", 200, declineService, "Service declined successfully");
}));
//accept service requset by sp(required service state:"Booked","ServiceCancelledBySP")
exports.acceptServiceRequest = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    console.log("Api runs...: acceptServiceRequest");
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { serviceId, serviceProgess, serviceDistance } = req.body;
    if (!serviceId && !serviceProgess) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Service ID and service progress is required");
    }
    const updateService = yield towingServiceBooking_model_1.default.findOneAndUpdate({
        _id: new mongoose_1.default.Types.ObjectId(serviceId),
        $or: [
            { serviceProgess: "Booked" },
            { serviceProgess: "ServiceCancelledBySP" },
        ],
    }, {
        serviceProgess,
        serviceProviderId: userId,
        updatedAt: Date.now(),
    }, { new: true });
    if (updateService) {
        const acceptedServiceDetails = {
            serviceId,
            serviceProgess,
            serviceDistance,
        };
        const updateResult = yield locationSession_models_1.default.findOneAndUpdate({
            userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
            isActive: true,
            "serviceDetails.serviceId": serviceId,
        }, {
            $set: {
                "serviceDetails.$.serviceProgess": acceptedServiceDetails.serviceProgess,
            },
        }, { new: true });
        if (!updateResult) {
            yield locationSession_models_1.default.findOneAndUpdate({ userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id, isActive: true }, {
                $push: {
                    serviceDetails: acceptedServiceDetails,
                },
            }, { new: true });
        }
        return (0, response_utils_1.handleResponse)(res, "success", 200, updateService, "Service Accepted Successfully");
    }
}));
exports.handleServiceRequestState = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: handleServiceRequestState");
}));
exports.getSavedDestination = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const savedDestination = yield towingServiceBooking_model_1.default.aggregate([
        {
            $match: {
                userId,
                isDeleted: false,
            },
        },
        {
            $project: {
                _id: 1,
                destinyLocation: 1,
                userId: 1,
            },
        },
    ]);
    return (0, response_utils_1.handleResponse)(res, "success", 200, savedDestination, "Saved destinations fetched Successfully");
}));
