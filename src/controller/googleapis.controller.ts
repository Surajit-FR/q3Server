import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.utils";
import axios from "axios";
import { CustomRequest } from "../../types/commonType";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import UserModel from "../models/user.model";
const GOOGLE_API_KEY = "AIzaSyDtPUxp_vFvbx9og_F-q0EBkJPAiCAbj8w";

export const getNearbyPlaces = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: getNearbyPlaces");

    const address = req.query.address as string;
    const location = req.query.location as string;
    const type =
      (req.query.type as string) ||
      "point_of_interest" ||
      "establishment" ||
      "finance";
    // const radius =  5000;

    if (!address) {
      res.status(400).json({ error: "Address is required" });
      return;
    }

    // // Step 1: Geocode the address
    // const geoResponse = await axios.get(
    //   "https://maps.googleapis.com/maps/api/geocode/json",
    //   {
    //     params: {
    //       address,
    //       key: GOOGLE_API_KEY,
    //     },
    //   }
    // );
    // console.log({ geoResponse });

    // const location = geoResponse.data.results[0]?.geometry?.location;

    // if (!location) {
    //   res
    //     .status(404)
    //     .json({ error: "Location not found for the given address" });
    //   return;
    // }

    // const { lat, lng } = location;

    // Step 2: Get nearby places
    const placesResponse = await axios.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      {
        params: {
          location,
          country: "IN",
          radius: 500000, // in meters
          // type,
          key: GOOGLE_API_KEY,
        },
      }
    );
    console.log({ placesResponse });

    res.json({
      address,
      // location: { lat, lng },
      results: placesResponse.data.results,
    });
  }
);

export async function getDistanceInKm(
  originPlaceId: string, //placeId
  destinationPlaceId: string //placeId
): Promise<number> {
  console.log("function runs...: getDistanceInKm");

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=place_id:${originPlaceId}&destinations=place_id:${destinationPlaceId}&key=${GOOGLE_API_KEY}`;

  // const url = "https://maps.googleapis.com/maps/api/distancematrix/json";
  const response = await axios.get(url);

  console.log({ response });

  let distanceMeters = response.data.rows[0]?.elements[0]?.distance?.value;
  const destination_addresses = response.data.destination_addresses as string;
  const origin_addresses = response.data.origin_addresses;
  const distance = distanceMeters ? distanceMeters / 1000 : 0; //km
  console.log({ distance });

  return distance;
};

export const getPlacesAutocomplete = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: getPlacesAutocomplete");

    const { input, sessiontoken, location } = req.query;
    const userId = req.user?._id;
    const userDetails = await UserModel.findById(userId);
    const userPhoneNumber = userDetails?.phone;
    const userCountry = parsePhoneNumberWithError(
      userPhoneNumber as string
    ).country;

    if (!input) {
      return res
        .status(400)
        .json({ message: "Missing required parameter: input" });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ message: "Google API key is not configured" });
    }

    let params = {
      input,
      key: apiKey,
      sessiontoken,
      components: `country:${userCountry}`,
      location,
      // type: "all",
      radius: 5000,
    };

    const url = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
    const response = await axios.get(url, { params });

    if (!response) {
      res
        .status(404)
        .json({ error: "Suggestion not found for the given address" });
      return;
    }

    return res.status(200).json({
      status: response.data.status,
      predictions: response.data.predictions,
      error_message: response.data.error_message || null,
    });
  }
);
// getDistanceInKm("ChIJd8BlQ2BZwokRAFUEcm_qrcA", "ChIJ6R0bZgB1AjoRFNzbjnJxiTM");

export const getPlaceDetailsById = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: getPlaceDetailsById");

    const { placeId } = req.query;

    if (!placeId) {
      return res.status(400).json({ message: "placeId is required" });
    }

    const googleApiKey = process.env.GOOGLE_API_KEY;

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${googleApiKey}`;

    const { data } = await axios.get(url);

    if (data.status !== "OK") {
      return res.status(400).json({
        message: "Error fetching place details",
        details: data.status,
      });
    }

    const placeDetails = {
      name: data.result.name,
      address: data.result.formatted_address,
      location: data.result.geometry?.location,
      types: data.result.types,
      phone: data.result.formatted_phone_number || null,
      website: data.result.website || null,
    };

    return res.json({ success: true, placeDetails });
  }
);
