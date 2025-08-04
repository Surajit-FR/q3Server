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
exports.getNearbyPlaces = void 0;
exports.getDistanceInKm = getDistanceInKm;
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const axios_1 = __importDefault(require("axios"));
const GOOGLE_API_KEY = "AIzaSyDtPUxp_vFvbx9og_F-q0EBkJPAiCAbj8w";
exports.getNearbyPlaces = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    console.log("Api runs...: getNearbyPlaces");
    const address = req.query.address;
    const type = req.query.type ||
        "point_of_interest" ||
        "establishment" ||
        "finance";
    // const radius =  5000;
    if (!address) {
        res.status(400).json({ error: "Address is required" });
        return;
    }
    // Step 1: Geocode the address
    const geoResponse = yield axios_1.default.get("https://maps.googleapis.com/maps/api/geocode/json", {
        params: {
            address,
            key: GOOGLE_API_KEY,
        },
    });
    const location = (_b = (_a = geoResponse.data.results[0]) === null || _a === void 0 ? void 0 : _a.geometry) === null || _b === void 0 ? void 0 : _b.location;
    if (!location) {
        res
            .status(404)
            .json({ error: "Location not found for the given address" });
        return;
    }
    const { lat, lng } = location;
    // Step 2: Get nearby places
    const placesResponse = yield axios_1.default.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", {
        params: {
            location: `${lat},${lng}`,
            radius: 3000, // in meters
            type,
            key: GOOGLE_API_KEY,
        },
    });
    res.json({
        address,
        location: { lat, lng },
        results: placesResponse.data.results,
    });
}));
function getDistanceInKm(origin, destination) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        console.log("function runs...: getDistanceInKm");
        const url = "https://maps.googleapis.com/maps/api/distancematrix/json";
        const response = yield axios_1.default.get(url, {
            params: {
                origins: origin,
                destinations: destination,
                key: GOOGLE_API_KEY,
                units: "metric",
            },
        });
        const distanceMeters = (_c = (_b = (_a = response.data.rows[0]) === null || _a === void 0 ? void 0 : _a.elements[0]) === null || _b === void 0 ? void 0 : _b.distance) === null || _c === void 0 ? void 0 : _c.value;
        return distanceMeters ? Math.ceil(distanceMeters / 1000) : 0;
    });
}
