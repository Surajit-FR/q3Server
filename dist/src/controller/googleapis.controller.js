"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlaceDetailsById = exports.getPlacesAutocomplete = exports.getNearbyPlaces = void 0;
exports.getDistanceInKm = getDistanceInKm;
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const axios_1 = __importDefault(require("axios"));
const libphonenumber_js_1 = require("libphonenumber-js");
const user_model_1 = __importDefault(require("../models/user.model"));
const GOOGLE_API_KEY = "AIzaSyDtPUxp_vFvbx9og_F-q0EBkJPAiCAbj8w";
exports.getNearbyPlaces = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    console.log("Api runs...: getNearbyPlaces");
    const address = req.query.address;
    const location = req.query.location;
    const type = req.query.type ||
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
    const placesResponse = await axios_1.default.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", {
        params: {
            location,
            country: "IN",
            radius: 500000, // in meters
            // type,
            key: GOOGLE_API_KEY,
        },
    });
    console.log({ placesResponse });
    res.json({
        address,
        // location: { lat, lng },
        results: placesResponse.data.results,
    });
});
async function getDistanceInKm(originPlaceId, //placeId
destinationPlaceId //placeId
) {
    var _a, _b, _c;
    console.log("function runs...: getDistanceInKm");
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=place_id:${originPlaceId}&destinations=place_id:${destinationPlaceId}&key=${GOOGLE_API_KEY}`;
    const response = await axios_1.default.get(url);
    let distanceMeters = (_c = (_b = (_a = response.data.rows[0]) === null || _a === void 0 ? void 0 : _a.elements[0]) === null || _b === void 0 ? void 0 : _b.distance) === null || _c === void 0 ? void 0 : _c.value;
    // convert meters → miles
    const miles = distanceMeters ? distanceMeters * 0.000621371 : 0;
    const destination_addresses = response.data.destination_addresses;
    const origin_addresses = response.data.origin_addresses;
    return miles;
}
exports.getPlacesAutocomplete = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    var _a;
    console.log("Api runs...: getPlacesAutocomplete");
    const { input, sessiontoken, location } = req.query;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const userDetails = await user_model_1.default.findById(userId);
    const userPhoneNumber = userDetails === null || userDetails === void 0 ? void 0 : userDetails.phone;
    const userCountryCode = userDetails === null || userDetails === void 0 ? void 0 : userDetails.countryCode;
    const userCountry = (0, libphonenumber_js_1.parsePhoneNumberWithError)(`${userCountryCode}${userPhoneNumber}`).country;
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
    const response = await axios_1.default.get(url, { params });
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
});
getDistanceInKm("ChIJgVkkYQB5AjoRU4-S9R-kIzM", "ChIJ8yrBIq91AjoRE_CdzZ6pfrk");
exports.getPlaceDetailsById = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    var _a;
    console.log("Api runs...: getPlaceDetailsById");
    const { placeId } = req.query;
    if (!placeId) {
        return res.status(400).json({ message: "placeId is required" });
    }
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${googleApiKey}`;
    const { data } = await axios_1.default.get(url);
    if (data.status !== "OK") {
        return res.status(400).json({
            message: "Error fetching place details",
            details: data.status,
        });
    }
    const placeDetails = {
        name: data.result.name,
        address: data.result.formatted_address,
        location: (_a = data.result.geometry) === null || _a === void 0 ? void 0 : _a.location,
        types: data.result.types,
        phone: data.result.formatted_phone_number || null,
        website: data.result.website || null,
    };
    return res.json({ success: true, placeDetails });
});
