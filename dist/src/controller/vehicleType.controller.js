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
exports.fetchVehicleTypes = exports.fetchVehicleTypebyId = exports.addVehicleType = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const response_utils_1 = require("../../utils/response.utils");
const vehicleType_model_1 = __importDefault(require("../models/vehicleType.model"));
// addVehicleType controller
exports.addVehicleType = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: addVehicleType");
    // console.log("api hits");
    const { type, image, totalSeat } = req.body;
    //check for the duplicacy
    const existinfVehicleType = yield vehicleType_model_1.default.findOne({ type });
    if (existinfVehicleType) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "Vehicle type with the same name already exists.");
    }
    // Create and save the shift
    const newVehicleType = yield vehicleType_model_1.default.create({
        type,
        image,
        totalSeat,
    });
    if (!newVehicleType) {
        return (0, response_utils_1.handleResponse)(res, "error", 500, "Something went wrong while adding the Shift.");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 201, newVehicleType, "Vehicle type added Successfully");
}));
// fetchVehicleTypebyId controller
exports.fetchVehicleTypebyId = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: fetchVehicleTypebyId");
    const { VehicleTypeId } = req.params;
    // console.log({VehicleTypeId});
    const results = yield vehicleType_model_1.default.aggregate([
        {
            $match: {
                _id: new mongoose_1.default.Types.ObjectId(VehicleTypeId),
            },
        },
        {
            $project: {
                isDeleted: 0,
                __v: 0,
            },
        },
    ]);
    const responseData = results.length
        ? (0, response_utils_1.handleResponse)(res, "success", 200, results[0], "Vehicle type retrieved successfully.")
        : (0, response_utils_1.handleResponse)(res, "success", 200, "", "Vehicle type not found.");
    return responseData;
}));
// fetchVehicleTypes controller
exports.fetchVehicleTypes = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: fetchVehicleTypes");
    const results = yield vehicleType_model_1.default.aggregate([
        { $match: { isDeleted: false } },
    ]);
    if (results.length) {
        return (0, response_utils_1.handleResponse)(res, "success", 200, results, "Vehicle types retrieved successfully.");
    }
    else {
        return (0, response_utils_1.handleResponse)(res, "success", 200, "", "Vehicle type not found.");
    }
}));
