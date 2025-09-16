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
exports.previewTowingService = exports.cancelServiceBySP = exports.fetchSingleService = exports.fetchTotalServiceProgresswiseBySp = exports.fetchTotalServiceByAdmin = exports.getUserServiceDetilsByState = exports.getSavedDestination = exports.handleServiceRequestState = exports.acceptServiceRequest = exports.cancelServiceRequestByCustomer = exports.declineServicerequest = exports.fetchTowingServiceRequest = exports.bookTowingService = void 0;
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const response_utils_1 = require("../../utils/response.utils");
const towingServiceBooking_model_1 = __importDefault(require("../models/towingServiceBooking.model"));
const googleapis_controller_1 = require("./googleapis.controller");
const locationSession_models_1 = __importDefault(require("../models/locationSession.models"));
const mongoose_1 = __importDefault(require("mongoose"));
const axios_1 = __importDefault(require("axios"));
const canceledServiceBySP_model_1 = require("../models/canceledServiceBySP.model");
const user_model_1 = __importDefault(require("../models/user.model"));
const vehicleType_model_1 = __importDefault(require("../models/vehicleType.model"));
const apiKey = "AIzaSyDtPUxp_vFvbx9og_F-q0EBkJPAiCAbj8w";
const isEligibleForBooking = (customerId) => __awaiter(void 0, void 0, void 0, function* () {
    const prevBookedServices = yield towingServiceBooking_model_1.default.aggregate([
        {
            $match: {
                userId: new mongoose_1.default.Types.ObjectId(customerId),
                $or: [
                    { serviceProgess: "Booked" },
                    { serviceProgess: "ServiceAccepted" },
                    { serviceProgess: "ServiceStarted" },
                    { serviceProgess: "ServiceCancelledBySP" },
                ],
            },
        },
    ]);
    // console.log({ prevBookedServices });
    const returnValue = prevBookedServices.length ? false : true;
    return returnValue;
});
// addVehicleType controller
exports.bookTowingService = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    console.log("Api runs...: bookTowingService");
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    let picklocation_derived, placeId_pickup_derived, placeId_destination_derived, picklocationString, distance_derived;
    const { pickupLocation, placeId_pickup, destinyLocation, placeId_destination, vehicleTypeId, disputedVehicleImage, serviceSpecificNotes, totalDistance, pickupLat, pickuplong, isCurrentLocationforPick = false, savedAddressId, } = req.body;
    const check = yield isEligibleForBooking(userId);
    if (!check) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "Previously booked service is pending now.");
    }
    if (!vehicleTypeId)
        return (0, response_utils_1.handleResponse)(res, "error", 400, "vehicleTypeId is required.");
    // if (!disputedVehicleImage)
    //   return handleResponse(
    //     res,
    //     "error",
    //     400,
    //     "disputedVehicleImage is required."
    //   );
    // if (!serviceSpecificNotes)
    //   return handleResponse(
    //     res,
    //     "error",
    //     400,
    //     "serviceSpecificNotes is required."
    //   );
    if (isCurrentLocationforPick) {
        if (!pickupLat && !pickuplong)
            return (0, response_utils_1.handleResponse)(res, "error", 400, "while choosing current location for picup location coordinates are required.");
        picklocation_derived = {
            type: "Point",
            coordinates: [pickuplong, pickupLat], // [longitude, latitude]
        };
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${pickupLat},${pickuplong}&key=${apiKey}`;
        const response = yield axios_1.default.get(url);
        console.log({ response });
        placeId_pickup_derived = (_c = (_b = response === null || response === void 0 ? void 0 : response.data) === null || _b === void 0 ? void 0 : _b.results[0]) === null || _c === void 0 ? void 0 : _c.place_id;
        picklocationString = (_e = (_d = response === null || response === void 0 ? void 0 : response.data) === null || _d === void 0 ? void 0 : _d.results[0]) === null || _e === void 0 ? void 0 : _e.formatted_address;
        placeId_destination_derived = placeId_destination;
    }
    else if (isCurrentLocationforPick === false) {
        //data given by autocomplete api
        if (!pickupLocation)
            return (0, response_utils_1.handleResponse)(res, "error", 400, "pickupLocation is required.");
        if (!placeId_pickup)
            return (0, response_utils_1.handleResponse)(res, "error", 400, "placeId_pickup is required.");
        if (!destinyLocation)
            return (0, response_utils_1.handleResponse)(res, "error", 400, "destinyLocation is required.");
        if (!placeId_destination)
            return (0, response_utils_1.handleResponse)(res, "error", 400, "placeId_destination is required.");
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId_pickup}&key=${apiKey}`;
        const response = yield axios_1.default.get(url);
        const loc = (_h = (_g = (_f = response === null || response === void 0 ? void 0 : response.data) === null || _f === void 0 ? void 0 : _f.result) === null || _g === void 0 ? void 0 : _g.geometry) === null || _h === void 0 ? void 0 : _h.location;
        picklocation_derived = {
            type: "Point",
            coordinates: [loc.lng, loc.lat], // [longitude, latitude]
        };
        placeId_destination_derived = placeId_destination;
        placeId_pickup_derived = placeId_pickup;
        picklocationString = pickupLocation;
    }
    else if (savedAddressId) {
        if (!placeId_destination)
            return (0, response_utils_1.handleResponse)(res, "error", 400, "placeId of destination is required.");
        if (!destinyLocation)
            return (0, response_utils_1.handleResponse)(res, "error", 400, "DestinyLocation is required.");
        placeId_destination_derived = placeId_destination;
    }
    console.log({ placeId_pickup_derived });
    console.log({ placeId_destination_derived });
    let distance = yield (0, googleapis_controller_1.getDistanceInKm)(placeId_pickup_derived, placeId_destination_derived);
    console.log({ distance });
    // // Create and save the shift
    const newBooking = yield towingServiceBooking_model_1.default.create({
        pickupLocation: picklocationString,
        placeId_pickup: placeId_pickup_derived,
        destinyLocation,
        placeId_destination: placeId_destination_derived,
        vehicleTypeId,
        disputedVehicleImage,
        serviceSpecificNotes,
        totalDistance: distance,
        pickupLat,
        pickuplong,
        isCurrentLocationforPick,
        userId,
        picklocation: picklocation_derived,
    });
    if (!newBooking) {
        return (0, response_utils_1.handleResponse)(res, "error", 500, "Something went wrong while booking.");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 201, newBooking, "Booking Successfully");
}));
//fetch near-by service request
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
    const radius = 250000000; // in meters
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
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "userId",
                as: "customer_details",
            },
        },
        {
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: "$customer_details",
            },
        },
        {
            $addFields: {
                customer_name: "$customer_details.fullName",
                customer_avatar: "$customer_details.avatar",
                // distance: "$totalDistance",
                towing_cost: { $multiply: [{ $toDouble: "$totalDistance" }, 5] },
            },
        },
        {
            $project: {
                _id: 1,
                // userId: 1,
                isDeleted: 1,
                createdAt: 1,
                latitude: 1,
                location: 1,
                longitude: 1,
                totalDistance: 1,
                serviceProgess: 1,
                pickupLocation: 1,
                destinyLocation: 1,
                customer_name: 1,
                customer_avatar: 1,
                towing_cost: 1,
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
//cancel service request by customer
exports.cancelServiceRequestByCustomer = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Api runs...: cancelServiceRequestByCustomer");
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { serviceId, serviceProgess = "ServiceCancelledByCustomer" } = req.body;
    if (!serviceId && !serviceProgess) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Service ID is required");
    }
    const updateService = yield towingServiceBooking_model_1.default.findOneAndUpdate({
        _id: new mongoose_1.default.Types.ObjectId(serviceId),
    }, {
        serviceProgess,
        updatedAt: Date.now(),
    }, { new: true });
    if (updateService) {
        return (0, response_utils_1.handleResponse)(res, "success", 200, {}, "Service cancelled successfully");
    }
    return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Something went wrong");
}));
//accept service requset by sp(required service state:"Booked","ServiceCancelledBySP")
exports.acceptServiceRequest = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    console.log("Api runs...: acceptServiceRequest");
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { serviceId, serviceProgess = "ServiceAccepted", serviceDistance, providerVehicleDetails, } = req.body;
    if (!serviceId && !serviceProgess) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Service ID and service progress is required");
    }
    if (!providerVehicleDetails) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Provider vehicle details is required");
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
        providerVehicleDetails,
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
    return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Something went wrong");
}));
//handle state of requested services after acceptance of that service
exports.handleServiceRequestState = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    console.log("Api runs...: handleServiceRequestState");
    const { serviceId, serviceProgess } = req.body;
    if (!serviceId || !serviceProgess) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Service ID and service progress are required");
    }
    const serviceDetails = yield towingServiceBooking_model_1.default.aggregate([
        {
            $match: {
                _id: new mongoose_1.default.Types.ObjectId(serviceId),
                serviceProviderId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            },
        },
    ]);
    if (!serviceDetails.length) {
        return (0, response_utils_1.handleResponse)(res, "error", 404, "", "Service details not found");
    }
    const previousState = serviceDetails[0].serviceProgess;
    const validTransitions = {
        ServiceAccepted: "ServiceStarted",
        ServiceStarted: "ServiceCompleted",
    };
    // Check if transition is valid
    if (validTransitions[previousState] !== serviceProgess) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", `Invalid state transition from ${previousState} to ${serviceProgess}`);
    }
    // Prepare update fields
    const updateFields = { serviceProgess };
    if (serviceProgess === "ServiceStarted") {
        updateFields.startedAt = new Date();
    }
    if (serviceProgess === "ServiceCompleted") {
        updateFields.completedAt = new Date();
    }
    // Update service booking
    const updatedService = yield towingServiceBooking_model_1.default.findOneAndUpdate({ _id: new mongoose_1.default.Types.ObjectId(serviceId) }, { $set: updateFields }, { new: true });
    if (!updatedService) {
        return (0, response_utils_1.handleResponse)(res, "error", 500, "", "Failed to update service");
    }
    // Update or push service details into active location session
    const serviceSessionDetails = {
        serviceId,
        serviceProgess,
        serviceDistance: serviceDetails[0].totalDistance,
    };
    const activeLocation = yield locationSession_models_1.default.findOneAndUpdate({
        userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
        isActive: true,
        "serviceDetails.serviceId": serviceId,
    }, {
        $set: {
            "serviceDetails.$.serviceProgess": serviceProgess,
        },
    }, { new: true });
    if (!activeLocation) {
        yield locationSession_models_1.default.findOneAndUpdate({ userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id, isActive: true }, { $push: { serviceDetails: serviceSessionDetails } }, { new: true });
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, updatedService, `Service ${serviceProgess
        .replace("Service", "")
        .toLowerCase()} successfully`);
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
                placeId_destination: 1,
            },
        },
    ]);
    return (0, response_utils_1.handleResponse)(res, "success", 200, savedDestination, "Saved destinations fetched Successfully");
}));
exports.getUserServiceDetilsByState = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const customerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { serviceProgess } = req.body;
    const customerServiceDetails = yield towingServiceBooking_model_1.default.aggregate([
        {
            $match: {
                isDeleted: false,
                serviceProgess,
                userId: customerId,
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "userId",
                as: "customer_details",
            },
        },
        {
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: "$customer_details",
            },
        },
        {
            $addFields: {
                customer_fullName: "$customer_details.fullName",
                customer_avatar: "$customer_details.avatar",
                towing_cost: { $multiply: [{ $toDouble: "$totalDistance" }, 5] },
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "serviceProviderId",
                as: "sp_details",
            },
        },
        {
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: "$sp_details",
            },
        },
        {
            $lookup: {
                from: "ratings",
                foreignField: "ratedTo",
                localField: "serviceProviderId",
                as: "sp_ratings",
            },
        },
        {
            $addFields: {
                sp_fullName: "$sp_details.fullName",
                sp_avatar: "$sp_details.avatar",
                sp_phoneNumber: "$sp_details.phone",
                sp_email: "$sp_details.email",
                sp_avg_rating: { $ifNull: [{ $avg: "$sp_ratings.rating" }, 0] },
            },
        },
        {
            $lookup: {
                from: "vehicletypes",
                foreignField: "_id",
                localField: "vehicleTypeId",
                as: "toeVehicle_details",
            },
        },
        {
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: "$toeVehicle_details",
            },
        },
        {
            $addFields: {
                toeVehicle_type: "$toeVehicle_details.type",
                toeVehicle_image: "$toeVehicle_details.image",
                toeVehicle_totalSeat: "$toeVehicle_details.totalSeat",
            },
        },
        {
            $project: {
                customer_details: 0,
                sp_ratings: 0,
                sp_details: 0,
                toeVehicle_details: 0,
                isCurrentLocationforPick: 0,
                picklocation: 0,
                customer_updatedAtdetails: 0,
                __v: 0,
            },
        },
    ]);
    return (0, response_utils_1.handleResponse)(res, "success", 200, customerServiceDetails, "Service requests fetched successfully");
}));
exports.fetchTotalServiceByAdmin = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceProgess } = req.body;
    const ServiceDetails = yield towingServiceBooking_model_1.default.aggregate([
        {
            $match: {
                isDeleted: false,
                // serviceProgess,
                // userId: customerId,
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "userId",
                as: "customer_details",
            },
        },
        {
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: "$customer_details",
            },
        },
        {
            $addFields: {
                customer_fullName: "$customer_details.fullName",
                customer_avatar: "$customer_details.avatar",
                towing_cost: { $multiply: [{ $toDouble: "$totalDistance" }, 5] },
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "serviceProviderId",
                as: "sp_details",
            },
        },
        {
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: "$sp_details",
            },
        },
        {
            $addFields: {
                sp_fullName: "$sp_details.fullName",
                sp_avatar: "$sp_details.avatar",
                sp_phoneNumber: "$sp_details.phone",
                sp_email: "$sp_details.email",
            },
        },
        {
            $lookup: {
                from: "vehicletypes",
                foreignField: "_id",
                localField: "vehicleTypeId",
                as: "toeVehicle_details",
            },
        },
        {
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: "$toeVehicle_details",
            },
        },
        {
            $addFields: {
                toeVehicle_type: "$toeVehicle_details.type",
                toeVehicle_image: "$toeVehicle_details.image",
                toeVehicle_totalSeat: "$toeVehicle_details.totalSeat",
            },
        },
        {
            $project: {
                customer_details: 0,
                sp_details: 0,
                toeVehicle_details: 0,
                isCurrentLocationforPick: 0,
                picklocation: 0,
                customer_updatedAtdetails: 0,
                __v: 0,
            },
        },
    ]);
    return (0, response_utils_1.handleResponse)(res, "success", 200, ServiceDetails, "Service requests fetched successfully");
}));
exports.fetchTotalServiceProgresswiseBySp = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceProgess } = req.body;
    const ServiceDetails = yield towingServiceBooking_model_1.default.aggregate([
        {
            $match: {
                isDeleted: false,
                serviceProgess,
                // userId: customerId,
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "userId",
                as: "customer_details",
            },
        },
        {
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: "$customer_details",
            },
        },
        {
            $addFields: {
                customer_fullName: "$customer_details.fullName",
                customer_avatar: "$customer_details.avatar",
                towing_cost: { $multiply: [{ $toDouble: "$totalDistance" }, 5] },
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "serviceProviderId",
                as: "sp_details",
            },
        },
        {
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: "$sp_details",
            },
        },
        {
            $addFields: {
                sp_fullName: "$sp_details.fullName",
                sp_avatar: "$sp_details.avatar",
                sp_phoneNumber: "$sp_details.phone",
                sp_email: "$sp_details.email",
            },
        },
        {
            $lookup: {
                from: "vehicletypes",
                foreignField: "_id",
                localField: "vehicleTypeId",
                as: "toeVehicle_details",
            },
        },
        {
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: "$toeVehicle_details",
            },
        },
        {
            $addFields: {
                toeVehicle_type: "$toeVehicle_details.type",
                toeVehicle_image: "$toeVehicle_details.image",
                toeVehicle_totalSeat: "$toeVehicle_details.totalSeat",
            },
        },
        {
            $project: {
                customer_details: 0,
                sp_details: 0,
                toeVehicle_details: 0,
                isCurrentLocationforPick: 0,
                picklocation: 0,
                customer_updatedAtdetails: 0,
                __v: 0,
            },
        },
    ]);
    return (0, response_utils_1.handleResponse)(res, "success", 200, ServiceDetails, "Service requests fetched successfully");
}));
exports.fetchSingleService = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceId } = req.params;
    const ServiceDetails = yield towingServiceBooking_model_1.default.aggregate([
        {
            $match: {
                _id: new mongoose_1.default.Types.ObjectId(serviceId),
                isDeleted: false,
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "userId",
                as: "customer_details",
            },
        },
        {
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: "$customer_details",
            },
        },
        {
            $addFields: {
                customer_fullName: "$customer_details.fullName",
                customer_avatar: "$customer_details.avatar",
                customer_phoneNumber: "$customer_details.phone",
                towing_cost: { $multiply: [{ $toDouble: "$totalDistance" }, 5] },
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "serviceProviderId",
                as: "sp_details",
            },
        },
        {
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: "$sp_details",
            },
        },
        {
            $addFields: {
                sp_fullName: "$sp_details.fullName",
                sp_avatar: "$sp_details.avatar",
                sp_phoneNumber: "$sp_details.phone",
                sp_email: "$sp_details.email",
            },
        },
        {
            $lookup: {
                from: "vehicletypes",
                foreignField: "_id",
                localField: "vehicleTypeId",
                as: "toeVehicle_details",
            },
        },
        {
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: "$toeVehicle_details",
            },
        },
        {
            $addFields: {
                toeVehicle_type: "$toeVehicle_details.type",
                toeVehicle_image: "$toeVehicle_details.image",
                toeVehicle_totalSeat: "$toeVehicle_details.totalSeat",
            },
        },
        {
            $project: {
                customer_details: 0,
                sp_details: 0,
                toeVehicle_details: 0,
                isCurrentLocationforPick: 0,
                picklocation: 0,
                customer_updatedAtdetails: 0,
                __v: 0,
            },
        },
    ]);
    return (0, response_utils_1.handleResponse)(res, "success", 200, ServiceDetails[0], "Service request fetched successfully");
}));
exports.cancelServiceBySP = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const SPId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { serviceId } = req.body;
    if (!serviceId) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Service ID  are required");
    }
    const serviceDetails = yield towingServiceBooking_model_1.default.aggregate([
        {
            $match: {
                _id: new mongoose_1.default.Types.ObjectId(serviceId),
                serviceProviderId: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
            },
        },
    ]);
    if (!serviceDetails.length) {
        return (0, response_utils_1.handleResponse)(res, "error", 404, "", "Service details not found");
    }
    const updatedService = yield towingServiceBooking_model_1.default.findOneAndUpdate({
        _id: new mongoose_1.default.Types.ObjectId(serviceId),
        serviceProviderId: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
    }, {
        $set: {
            serviceProgess: "ServiceCancelledBySP",
            serviceProviderId: null,
        },
    });
    if (updatedService) {
        const canceledService = {
            costumerId: (_d = serviceDetails[0]) === null || _d === void 0 ? void 0 : _d.userId,
            spId: (_e = req.user) === null || _e === void 0 ? void 0 : _e._id,
            serviceId,
            progressBeforeCancel: (_f = serviceDetails[0]) === null || _f === void 0 ? void 0 : _f.serviceProgess,
        };
        yield new canceledServiceBySP_model_1.CancelServiceBySPModel(canceledService).save();
        return (0, response_utils_1.handleResponse)(res, "success", 200, updatedService, "Service request cancelled successfully");
    }
    return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Something went wrong");
}));
exports.previewTowingService = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    console.log("Api runs...: previewTowingService");
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { placeId_pickup, placeId_destination, vehicleTypeId } = req.body;
    if (!vehicleTypeId)
        return (0, response_utils_1.handleResponse)(res, "error", 400, "vehicleTypeId is required.");
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=place_id:${placeId_pickup}&destinations=place_id:${placeId_destination}&key=${apiKey}`;
    const response = yield axios_1.default.get(url);
    let distanceMeters = (_d = (_c = (_b = response.data.rows[0]) === null || _b === void 0 ? void 0 : _b.elements[0]) === null || _c === void 0 ? void 0 : _c.distance) === null || _d === void 0 ? void 0 : _d.value;
    const distance = distanceMeters ? distanceMeters / 1000 : 0; //km
    const destination_addresses = response.data.destination_addresses;
    const origin_addresses = response.data.origin_addresses;
    const user = yield user_model_1.default.findById(userId).select("fullName email phone");
    const vehicle = yield vehicleType_model_1.default
        .findById(vehicleTypeId)
        .select("type totalSeat");
    if (!vehicle) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "Invalid vehicleTypeId.");
    }
    const perKmRate = 5;
    const towingCost = (distance * perKmRate).toFixed(2);
    const previewData = {
        user: {
            name: user === null || user === void 0 ? void 0 : user.fullName,
            email: user === null || user === void 0 ? void 0 : user.email,
            phone: user === null || user === void 0 ? void 0 : user.phone,
        },
        date: new Date(),
        pickupLocation: origin_addresses,
        destinyLocation: destination_addresses,
        distance,
        vehicleType: vehicle === null || vehicle === void 0 ? void 0 : vehicle.type,
        totalSeat: vehicle === null || vehicle === void 0 ? void 0 : vehicle.totalSeat,
        towingCost,
    };
    return (0, response_utils_1.handleResponse)(res, "success", 200, previewData, "Preview booking details");
}));
