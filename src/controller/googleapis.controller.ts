import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.utils";
import axios from "axios";

const GOOGLE_API_KEY = "AIzaSyDtPUxp_vFvbx9og_F-q0EBkJPAiCAbj8w";

export const getNearbyPlaces = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: getNearbyPlaces");

    const address = req.query.address as string;
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

    // Step 1: Geocode the address
    const geoResponse = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address,
          key: GOOGLE_API_KEY,
        },
      }
    );

    const location = geoResponse.data.results[0]?.geometry?.location;

    if (!location) {
      res
        .status(404)
        .json({ error: "Location not found for the given address" });
      return;
    }

    const { lat, lng } = location;

    // Step 2: Get nearby places
    const placesResponse = await axios.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      {
        params: {
          location: `${lat},${lng}`,
          radius: 3000, // in meters
          type,
          key: GOOGLE_API_KEY,
        },
      }
    );

    res.json({
      address,
      location: { lat, lng },
      results: placesResponse.data.results,
    });
  }
);

export async function getDistanceInKm(
  origin: string,
  destination: string
): Promise<number> {
  console.log("function runs...: getDistanceInKm");

  const url = "https://maps.googleapis.com/maps/api/distancematrix/json";
  const response = await axios.get(url, {
    params: {
      origins: origin,
      destinations: destination,
      key: GOOGLE_API_KEY,
      units: "metric",
    },
  });

  const distanceMeters = response.data.rows[0]?.elements[0]?.distance?.value;
  return distanceMeters ? Math.ceil(distanceMeters / 1000) : 0;
}
