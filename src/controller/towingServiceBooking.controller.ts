import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.utils";
import { CustomRequest } from "../../types/commonType";
import { handleResponse } from "../../utils/response.utils";
import towingServiceBookingModel from "../models/towingServiceBooking.model";
import { getDistanceInKm } from "./googleapis.controller";
import LocationSessionModel from "../models/locationSession.models";
import mongoose from "mongoose";
import axios from "axios";
import { CancelServiceBySPModel } from "../models/canceledServiceBySP.model";

const apiKey = "AIzaSyDtPUxp_vFvbx9og_F-q0EBkJPAiCAbj8w";

// addVehicleType controller
export const bookTowingService = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: bookTowingService");

    const userId = req.user?._id;
    let picklocation_derived,
      placeId_pickup_derived,
      placeId_destination_derived,
      picklocationString,
      distance_derived;

    const {
      pickupLocation,
      placeId_pickup,
      destinyLocation,
      placeId_destination,
      vehicleTypeId,
      disputedVehicleImage,
      serviceSpecificNotes,
      totalDistance,
      pickupLat,
      pickuplong,
      isCurrentLocationforPick = false,
      savedAddressId,
    } = req.body;

    if (!vehicleTypeId)
      return handleResponse(res, "error", 400, "vehicleTypeId is required.");
    if (!disputedVehicleImage)
      return handleResponse(
        res,
        "error",
        400,
        "disputedVehicleImage is required."
      );
    // if (!serviceSpecificNotes)
    //   return handleResponse(
    //     res,
    //     "error",
    //     400,
    //     "serviceSpecificNotes is required."
    //   );

    if (isCurrentLocationforPick) {
      if (!pickupLat && !pickuplong)
        return handleResponse(
          res,
          "error",
          400,
          "while choosing current location for picup location coordinates are required."
        );

      picklocation_derived = {
        type: "Point",
        coordinates: [pickuplong, pickupLat], // [longitude, latitude]
      };
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${pickupLat},${pickuplong}&key=${apiKey}`;
      const response = await axios.get(url);
      console.log({ response });

      placeId_pickup_derived = response?.data?.results[0]?.place_id;
      picklocationString = response?.data?.results[0]?.formatted_address;
      placeId_destination_derived = placeId_destination;
    } else if (isCurrentLocationforPick === false) {
      //data given by autocomplete api
      if (!pickupLocation)
        return handleResponse(res, "error", 400, "pickupLocation is required.");
      if (!placeId_pickup)
        return handleResponse(res, "error", 400, "placeId_pickup is required.");
      if (!destinyLocation)
        return handleResponse(
          res,
          "error",
          400,
          "destinyLocation is required."
        );
      if (!placeId_destination)
        return handleResponse(
          res,
          "error",
          400,
          "placeId_destination is required."
        );

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId_pickup}&key=${apiKey}`;
      const response = await axios.get(url);
      const loc = response?.data?.result?.geometry?.location;

      picklocation_derived = {
        type: "Point",
        coordinates: [loc.lng, loc.lat], // [longitude, latitude]
      };
      placeId_destination_derived = placeId_destination;
      placeId_pickup_derived = placeId_pickup;
      picklocationString = pickupLocation;
    } else if (savedAddressId) {
      if (!placeId_destination)
        return handleResponse(
          res,
          "error",
          400,
          "placeId of destination is required."
        );
      if (!destinyLocation)
        return handleResponse(
          res,
          "error",
          400,
          "DestinyLocation is required."
        );
      placeId_destination_derived = placeId_destination;
    }

    console.log({ placeId_pickup_derived });
    console.log({ placeId_destination_derived });

    let distance = await getDistanceInKm(
      placeId_pickup_derived,
      placeId_destination_derived
    );
    console.log({ distance });

    // // Create and save the shift
    const newBooking = await towingServiceBookingModel.create({
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
      return handleResponse(
        res,
        "error",
        500,
        "Something went wrong while booking."
      );
    }

    return handleResponse(
      res,
      "success",
      201,
      newBooking,
      "Booking Successfully"
    );
  }
);

//fetch near-by service request
export const fetchTowingServiceRequest = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: fetchTowingServiceRequest");

    const userId = req.user?._id as string;
    const userType = req.user?.userType;

    let serviceProviderId: string | undefined;
    let address: any;

    address = await LocationSessionModel.findOne({ userId, isActive: true });
    console.log({ address });

    if (!address || !address.longitude || !address.latitude) {
      return handleResponse(res, "error", 400, "SP's location not found.");
    }

    const longitude = address.longitude;
    const latitude = address.latitude;
    // Extract coordinates and validate
    const serviceProviderLongitude: number = parseFloat(longitude);
    const serviceProviderLatitude: number = parseFloat(latitude);

    if (isNaN(serviceProviderLongitude) || isNaN(serviceProviderLatitude)) {
      return handleResponse(res, "error", 400, "Invalid longitude or latitude");
    }
    const radius = 250000000; // in meters

    const serviceRequests = await towingServiceBookingModel.aggregate([
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
          towing_cost: "25",
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
      return handleResponse(
        res,
        "success",
        200,
        serviceRequests,
        "No nearby service request found"
      );
    }

    return handleResponse(
      res,
      "success",
      200,
      serviceRequests,
      "Service requests fetched successfully"
    );
  }
);

//decline service request by sp
export const declineServicerequest = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: declineServicerequest");
    const { serviceId } = req.body;
    const spId = req.user?._id;
    const declineService = await towingServiceBookingModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(serviceId),
      },
      {
        $push: { declinedBy: spId },
      },
      {
        new: true,
      }
    );
    return handleResponse(
      res,
      "success",
      200,
      declineService,
      "Service declined successfully"
    );
  }
);

//accept service requset by sp(required service state:"Booked","ServiceCancelledBySP")
export const acceptServiceRequest = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: acceptServiceRequest");

    const userId = req.user?._id;
    const {
      serviceId,
      serviceProgess = "ServiceAccepted",
      serviceDistance,
      providerVehicleDetails, 
    } = req.body;
    if (!serviceId && !serviceProgess) {
      return handleResponse(
        res,
        "error",
        400,
        "",
        "Service ID and service progress is required"
      );
    }
    if (!providerVehicleDetails) {
      return handleResponse(
        res,
        "error",
        400,
        "",
        "Provider vehicle details is required"
      );
    }

    const updateService = await towingServiceBookingModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(serviceId),
        $or: [
          { serviceProgess: "Booked" },
          { serviceProgess: "ServiceCancelledBySP" },
        ],
      },
      {
        serviceProgess,
        serviceProviderId: userId,
        providerVehicleDetails,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (updateService) {
      const acceptedServiceDetails = {
        serviceId,
        serviceProgess,
        serviceDistance,
      };
      const updateResult = await LocationSessionModel.findOneAndUpdate(
        {
          userId: req.user?._id,
          isActive: true,
          "serviceDetails.serviceId": serviceId,
        },
        {
          $set: {
            "serviceDetails.$.serviceProgess":
              acceptedServiceDetails.serviceProgess,
          },
        },
        { new: true }
      );
      if (!updateResult) {
        await LocationSessionModel.findOneAndUpdate(
          { userId: req.user?._id, isActive: true },
          {
            $push: {
              serviceDetails: acceptedServiceDetails,
            },
          },
          { new: true }
        );
      }

      return handleResponse(
        res,
        "success",
        200,
        updateService,
        "Service Accepted Successfully"
      );
    }
    return handleResponse(res, "error", 400, "", "Something went wrong");
  }
);

//handle state of requested services after acceptance of that service
export const handleServiceRequestState = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: handleServiceRequestState");

    const { serviceId, serviceProgess } = req.body;

    if (!serviceId || !serviceProgess) {
      return handleResponse(
        res,
        "error",
        400,
        "",
        "Service ID and service progress are required"
      );
    }

    const serviceDetails = await towingServiceBookingModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(serviceId),
          serviceProviderId: req.user?._id,
        },
      },
    ]);

    if (!serviceDetails.length) {
      return handleResponse(res, "error", 404, "", "Service details not found");
    }

    const previousState = serviceDetails[0].serviceProgess as string;
    const validTransitions: Record<string, string> = {
      ServiceAccepted: "ServiceStarted",
      ServiceStarted: "ServiceCompleted",
    };

    // Check if transition is valid
    if (validTransitions[previousState] !== serviceProgess) {
      return handleResponse(
        res,
        "error",
        400,
        "",
        `Invalid state transition from ${previousState} to ${serviceProgess}`
      );
    }

    // Prepare update fields
    const updateFields: any = { serviceProgess };
    if (serviceProgess === "ServiceStarted") {
      updateFields.startedAt = new Date();
    }
    if (serviceProgess === "ServiceCompleted") {
      updateFields.completedAt = new Date();
    }

    // Update service booking
    const updatedService = await towingServiceBookingModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(serviceId) },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedService) {
      return handleResponse(res, "error", 500, "", "Failed to update service");
    }

    // Update or push service details into active location session
    const serviceSessionDetails = {
      serviceId,
      serviceProgess,
      serviceDistance: serviceDetails[0].totalDistance,
    };

    const activeLocation = await LocationSessionModel.findOneAndUpdate(
      {
        userId: req.user?._id,
        isActive: true,
        "serviceDetails.serviceId": serviceId,
      },
      {
        $set: {
          "serviceDetails.$.serviceProgess": serviceProgess,
        },
      },
      { new: true }
    );

    if (!activeLocation) {
      await LocationSessionModel.findOneAndUpdate(
        { userId: req.user?._id, isActive: true },
        { $push: { serviceDetails: serviceSessionDetails } },
        { new: true }
      );
    }

    return handleResponse(
      res,
      "success",
      200,
      updatedService,
      `Service ${serviceProgess
        .replace("Service", "")
        .toLowerCase()} successfully`
    );
  }
);

export const getSavedDestination = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const savedDestination = await towingServiceBookingModel.aggregate([
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
    return handleResponse(
      res,
      "success",
      200,
      savedDestination,
      "Saved destinations fetched Successfully"
    );
  }
);

export const getUserServiceDetilsByState = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const customerId = req.user?._id;
    const { serviceProgess } = req.body;
    const customerServiceDetails = await towingServiceBookingModel.aggregate([
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
          towing_cost: "25",
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

    return handleResponse(
      res,
      "success",
      200,
      customerServiceDetails,
      "Service requests fetched successfully"
    );
  }
);

export const fetchTotalServiceByAdmin = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { serviceProgess } = req.body;
    const ServiceDetails = await towingServiceBookingModel.aggregate([
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
          towing_cost: "25",
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

    return handleResponse(
      res,
      "success",
      200,
      ServiceDetails,
      "Service requests fetched successfully"
    );
  }
);

export const fetchTotalServiceBySp = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { serviceProgess } = req.body;
    const ServiceDetails = await towingServiceBookingModel.aggregate([
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
          towing_cost: "25",
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

    return handleResponse(
      res,
      "success",
      200,
      ServiceDetails,
      "Service requests fetched successfully"
    );
  }
);

export const fetchSingleService = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { serviceId } = req.params;
    const ServiceDetails = await towingServiceBookingModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(serviceId),
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
          towing_cost: "25",
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

    return handleResponse(
      res,
      "success",
      200,
      ServiceDetails[0],
      "Service request fetched successfully"
    );
  }
);

export const cancelServiceBySP = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const SPId = req.user?._id;
    const { serviceId } = req.body;
    if (!serviceId) {
      return handleResponse(res, "error", 400, "", "Service ID  are required");
    }

    const serviceDetails = await towingServiceBookingModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(serviceId),
          serviceProviderId: req.user?._id,
        },
      },
    ]);

    if (!serviceDetails.length) {
      return handleResponse(res, "error", 404, "", "Service details not found");
    }

    const updatedService = await towingServiceBookingModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(serviceId),
        serviceProviderId: req.user?._id,
      },
      {
        $set: {
          serviceProgess: "ServiceCancelledBySP",
          serviceProviderId: null,
        },
      }
    );
    if (updatedService) {
      const canceledService = {
        costumerId: serviceDetails[0]?.userId,
        spId: req.user?._id,
        serviceId,
        progressBeforeCancel: serviceDetails[0]?.serviceProgess,
      };
      await new CancelServiceBySPModel(cancelServiceBySP).save();

      return handleResponse(
        res,
        "success",
        200,
        updatedService,
        "Service request cancelled successfully"
      );
    }
    return handleResponse(res, "error", 400, "", "Something went wrong");
  }
);
