import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.utils"; 5
import { CustomRequest } from "../../types/commonType";
import { handleResponse } from "../../utils/response.utils";
import towingServiceBookingModel from "../models/towingServiceBooking.model";
import { getDistanceInKm } from "./googleapis.controller";
import LocationSessionModel from "../models/locationSession.models";
import mongoose from "mongoose";

// addVehicleType controller
export const bookTowingService = asyncHandler(async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;

    const { pickupLocation, destinyLocation, vehicleTypeId, disputedVehicleImage, serviceSpecificNotes, totalDistance, pickupLat, pickuplong } = req.body;

    if (!pickupLocation) return handleResponse(res, "error", 400, "pickupLocation is required.");
    if (!destinyLocation) return handleResponse(res, "error", 400, "destinyLocation is required.");
    if (!vehicleTypeId) return handleResponse(res, "error", 400, "vehicleTypeId is required.");
    if (!disputedVehicleImage) return handleResponse(res, "error", 400, "disputedVehicleImage is required.");
    if (!serviceSpecificNotes) return handleResponse(res, "error", 400, "serviceSpecificNotes is required.");

    const picklocation = {
        type: "Point",
        coordinates: [pickuplong, pickupLat] // [longitude, latitude]
    };

    const distance = await getDistanceInKm(pickupLocation, destinyLocation);

    // // Create and save the shift
    const newBooking = await towingServiceBookingModel.create({
        pickupLocation,
        destinyLocation,
        vehicleTypeId,
        disputedVehicleImage,
        serviceSpecificNotes,
        userId,
        totalDistance: distance,
        picklocation
    });

    if (!newBooking) {
        return handleResponse(res, "error", 500, "Something went wrong while booking.")
    };

    return handleResponse(res, "success", 201, newBooking, "Booking Successfully")
});

export const fetchTowingServiceRequest = asyncHandler(async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id as string;
    const userType = req.user?.userType;

    let serviceProviderId: string | undefined;
    let address: any;


    address = await LocationSessionModel.findOne({ userId, isActive: true });
    console.log({ address });


    if (!address || !address.longitude || !address.latitude) {
        return handleResponse(res, "error", 400, 'User\'s location not found.');
    }

    const longitude = address.longitude;
    const latitude = address.latitude;
    // Extract coordinates and validate
    const serviceProviderLongitude: number = parseFloat(longitude);
    const serviceProviderLatitude: number = parseFloat(latitude);

    if (isNaN(serviceProviderLongitude) || isNaN(serviceProviderLatitude)) {
        return handleResponse(res, "error", 400, 'Invalid longitude or latitude');
    }
    const radius = 25000; // in meters

    const serviceRequests = await towingServiceBookingModel.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [serviceProviderLongitude, serviceProviderLatitude] },
                distanceField: 'distance',
                spherical: true,
                maxDistance: radius,
            }
        },
        {
            $addFields: {
                distance: { $ceil: "$distance" }
            }
        },
        {
            $match: {
                isDeleted: false,
                isReqAccepted: false,
                // $or: [
                //     { requestProgress: "NotStarted" },
                //     { requestProgress: "CancelledBySP" },
                // ]
            }
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
            }
        }
    ]);
    if (!serviceRequests.length) {
        return handleResponse(res, "success", 200, serviceRequests, 'No nearby service request found');
    }

    return handleResponse(res, 'success', 200, serviceRequests, "Service requests fetched successfully");
});


export const acceptServiceRequest = asyncHandler(async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { serviceId, serviceProgess, serviceDistance } = req.body;
    if (!serviceId && !serviceProgess) {
        return handleResponse(res, "error", 400, "", "Service ID and service progress is required")
    };

    const updateService = await towingServiceBookingModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(serviceId) },
        {
            serviceProgess,
            serviceProviderId: userId,
            updatedAt: Date.now()
        },
        { new: true }
    )

    if (updateService) {
        const acceptedServiceDetails = {
            serviceId,
            serviceProgess,
            serviceDistance
        }
        const updateResult = await LocationSessionModel.findOneAndUpdate(
            {
                userId: req.user?._id,
                isActive: true,
                "serviceDetails.serviceId": serviceId
            },
            {
                $set: {
                    "serviceDetails.$.serviceProgess": acceptedServiceDetails.serviceProgess,
                }
            },
            { new: true }
        );
        if (!updateResult) {
            await LocationSessionModel.findOneAndUpdate(
                { userId: req.user?._id, isActive: true },
                {
                    $push: {
                        serviceDetails: acceptedServiceDetails
                    }
                },
                { new: true }
            );
        }

        return handleResponse(res, "success", 200, updateService, "Service Accepted Successfully")
    }

}) 
