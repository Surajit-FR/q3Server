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
import UserModel from "../models/user.model";
import vehicleTypeModel from "../models/vehicleType.model";
import CustomPricingModel from "../models/customPricingRule.model";
import PricingRuleModel from "../models/pricingRule.model";
import { log } from "console";

const apiKey = "AIzaSyDtPUxp_vFvbx9og_F-q0EBkJPAiCAbj8w";

const isEligibleForBooking = async (customerId: string) => {
  const prevBookedServices = await towingServiceBookingModel.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(customerId),
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
};

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

    const check = await isEligibleForBooking(userId as string);
    if (!check) {
      return handleResponse(
        res,
        "error",
        400,
        "Previously booked service is pending now."
      );
    }

    if (!vehicleTypeId)
      return handleResponse(res, "error", 400, "vehicleTypeId is required.");
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
    let bookingDetails: any = {
      pickupLocation: picklocationString,
      placeId_pickup: placeId_pickup_derived,
      destinyLocation,
      placeId_destination: placeId_destination_derived,
      vehicleTypeId,
      disputedVehicleImage,
      serviceSpecificNotes,
      totalDistance: distance.toFixed(2),
      pickupLat,
      pickuplong,
      isCurrentLocationforPick,
      userId,
      picklocation: picklocation_derived,
    };

    const vehicleInfo = await vehicleTypeModel.findById({
      _id: new mongoose.Types.ObjectId(vehicleTypeId),
    });
    let customResponseMsg: any = { message: "Booking Successfully" };
    if (vehicleInfo?.type === "Truck") {
      bookingDetails.isCustomPricing = true;
      const contactAdmin = await CustomPricingModel.find({});
      customResponseMsg = {
        message:
          "Call for heavy vehicle rates. Pricing varies depending on weight",
        contactNo: contactAdmin[0].contactNumber,
      };
    } else {
      const pricingDeatils = await PricingRuleModel.find({});
      console.log({ pricingDeatils });

      const includedMiles = pricingDeatils[0]?.includedMiles || 0;
      const baseFee = pricingDeatils[0]?.baseFee || 0;
      const additionalFee = pricingDeatils[0]?.additionalFee || 0;

      let extraMiles = Math.floor(distance - includedMiles);
      if (extraMiles < 0) extraMiles = 0;

      const costPerMile =
        Math.floor(pricingDeatils[0]?.costPerMile || 0) * extraMiles;

      let PricingData = {
        baseFee,
        includedMiles,
        extraMiles,
        costPerMile,
        additionalFee,
        total: Math.floor(baseFee + costPerMile + additionalFee),
      };
      bookingDetails.pricing = PricingData;
    }

    // // Create and save the service
    const newBooking = await towingServiceBookingModel.create(bookingDetails);

    if (!newBooking) {
      return handleResponse(
        res,
        "error",
        500,
        "Something went wrong while booking."
      );
    }

    return handleResponse(res, "success", 201, newBooking, customResponseMsg);
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
          towing_cost: "$pricing.total",
        },
      },
      {
        $lookup: {
          from: "vehicletypes",
          foreignField: "_id",
          localField: "vehicleTypeId",
          as: "vehicletypes_details",
        },
      },
      {
        $unwind: {
          preserveNullAndEmptyArrays: true,
          path: "$vehicletypes_details",
        },
      },
      {
        $addFields: {
          vehicleType: "$vehicletypes_details.type",
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
      {
        $match: {
          vehicleType: { $ne: "Truck" },
        },
      },
    ]);
    
    console.log({serviceRequests});
    
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

//cancel service request by customer
export const cancelServiceRequestByCustomer = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: cancelServiceRequestByCustomer");

    const userId = req.user?._id;
    const { serviceId, serviceProgess = "ServiceCancelledByCustomer" } =
      req.body;
    if (!serviceId && !serviceProgess) {
      return handleResponse(res, "error", 400, "", "Service ID is required");
    }

    const updateService = await towingServiceBookingModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(serviceId),
      },
      {
        serviceProgess,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (updateService) {
      return handleResponse(
        res,
        "success",
        200,
        {},
        "Service cancelled successfully"
      );
    }
    return handleResponse(res, "error", 400, "", "Something went wrong");
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
        isReqAccepted: true,
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
    console.log("Api runs...: getSavedDestination");

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
    console.log("Api runs...: getUserServiceDetilsByState");

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
          towing_cost: "$pricing.total",
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
        $lookup: {
          from: "custompricings",
          localField: "toeVehicle_type",
          foreignField: "appliesToVehicleType",
          as: "customPricingInfo",
        },
      },
      {
        $unwind: {
          preserveNullAndEmptyArrays: true,
          path: "$customPricingInfo",
        },
      },
      {
        $addFields: {
          adminContact: {
            $cond: {
              if: { $eq: ["$toeVehicle_type", "Truck"] },
              then: "$customPricingInfo.contactNumber",
              else: null,
            },
          },
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
          // customPricingInfo: 0,
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
    console.log("Api runs...: fetchTotalServiceByAdmin");

    const { page = 1, limit = 10, query = "" } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const searchQuery = query
      ? {
          isDeleted: false,

          $or: [
            { sp_fullName: { $regex: query, $options: "i" } },
            { customer_fullName: { $regex: query, $options: "i" } },
            { sp_email: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const matchCriteria = {
      ...searchQuery,
    };

    console.log({ matchCriteria });

    const ServiceDetails = await towingServiceBookingModel.aggregate([
      {
        $match: { isDeleted: false },
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
          towing_cost: "$pricing.total",
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
      {
        $match: matchCriteria,
      },
      { $sort: { createdAt: -1 } },
      { $skip: (pageNumber - 1) * limitNumber },
      { $limit: limitNumber },
    ]);

    // const totalRecords = await towingServiceBookingModel.countDocuments(
    //   matchCriteria
    // );
    const totalRecords = ServiceDetails.map((serviceData) => {
      if (
        serviceData.customer_fullName === query ||
        serviceData.sp_fullName === query
      )
        return serviceData;
    });

    return handleResponse(
      res,
      "success",
      200,
      {
        ServiceDetails,
        pagination: {
          total: totalRecords.length,
          page: pageNumber,
          limit: limitNumber,
        },
      },
      "Service requests fetched successfully"
    );
  }
);

export const fetchTotalServiceProgresswiseBySp = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: fetchTotalServiceProgresswiseBySp");

    const { serviceProgess } = req.body;
    const ServiceDetails = await towingServiceBookingModel.aggregate([
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
          towing_cost: "$pricing.total",
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
    console.log("Api runs...: fetchSingleService");

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
          towing_cost: "$pricing.total",
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
    console.log("Api runs...: cancelServiceBySP");

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
      await new CancelServiceBySPModel(canceledService).save();

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

export const previewTowingService = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: previewTowingService");

    const userId = req.user?._id;

    const { placeId_pickup, placeId_destination, vehicleTypeId } = req.body;

    if (!vehicleTypeId)
      return handleResponse(res, "error", 400, "vehicleTypeId is required.");

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=place_id:${placeId_pickup}&destinations=place_id:${placeId_destination}&key=${apiKey}`;

    const response = await axios.get(url);

    let distanceMeters = response.data.rows[0]?.elements[0]?.distance?.value;
    const distance = distanceMeters ? distanceMeters / 1000 : 0; //km
    const destination_addresses = response.data.destination_addresses as string;
    const origin_addresses = response.data.origin_addresses;

    const user = await UserModel.findById(userId).select(
      "fullName email phone"
    );

    const vehicle = await vehicleTypeModel
      .findById(vehicleTypeId)
      .select("type totalSeat");

    if (!vehicle) {
      return handleResponse(res, "error", 400, "Invalid vehicleTypeId.");
    }
    let towingCost = 0;

    if (vehicle?.type !== "Truck") {
      const pricingDeatils = await PricingRuleModel.find({});
      console.log({ pricingDeatils });

      const includedMiles = pricingDeatils[0]?.includedMiles || 0;
      const baseFee = pricingDeatils[0]?.baseFee || 0;
      const additionalFee = pricingDeatils[0]?.additionalFee || 0;

      let extraMiles = Math.floor(distance - includedMiles);
      if (extraMiles < 0) extraMiles = 0;

      const costPerMile =
        Math.floor(pricingDeatils[0]?.costPerMile || 0) * extraMiles;

      let PricingData = {
        baseFee,
        includedMiles,
        extraMiles,
        costPerMile,
        additionalFee,
        total: Math.floor(baseFee + costPerMile + additionalFee),
      };
      towingCost = PricingData.total;
    }

    const perKmRate = 5;

    const previewData = {
      user: {
        name: user?.fullName,
        email: user?.email,
        phone: user?.phone,
      },
      date: new Date(),
      pickupLocation: origin_addresses,
      destinyLocation: destination_addresses,
      distance,
      vehicleType: vehicle?.type,
      totalSeat: vehicle?.totalSeat,
      towingCost,
    };

    return handleResponse(
      res,
      "success",
      200,
      previewData,
      "Preview booking details"
    );
  }
);

// Function to fetch associated customer with the service request
export const fetchAssociatedCustomer = async (serviceId: string) => {
  console.log("Function runs...: fetchAssociatedCustomer");

  console.log({ serviceId });

  if (!serviceId) {
    throw new Error("Service request ID is required.");
  }

  const serviceRequest = await towingServiceBookingModel.aggregate([
    {
      $match: {
        isDeleted: false,
        _id: new mongoose.Types.ObjectId(serviceId),
      },
    },
  ]);

  if (!serviceRequest || serviceRequest.length === 0) {
    throw new Error("Service request not found.");
  }

  return serviceRequest[0].userId;
};
