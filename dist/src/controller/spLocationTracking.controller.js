"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSPLocation = exports.updateSPLocation = void 0;
const spLocationTracking_model_1 = __importDefault(require("../models/spLocationTracking.model"));
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const response_utils_1 = require("../../utils/response.utils");
exports.updateSPLocation = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    const { spId = req.user._id, serviceId, lat, lng } = req.body;
    if (!spId || !serviceId || !lat || !lng) {
        return res.status(400).json({
            status: "error",
            message: "Required fields missing",
        });
    }
    const newPoint = {
        lat,
        lng,
        timestamp: new Date(),
    };
    const updatedDoc = await spLocationTracking_model_1.default.findOneAndUpdate({ spId, serviceId }, {
        $push: {
            lastLocations: {
                $each: [newPoint],
                $slice: -2, // only last 2 locations kept
            },
        },
    }, {
        upsert: true,
        new: true,
    });
    return (0, response_utils_1.handleResponse)(res, "success", 200, updatedDoc, "SP location updated");
});
exports.getSPLocation = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    const { serviceId } = req.body;
    console.log(req.body, "fetch sp locats while tracking");
    const locationRecord = await spLocationTracking_model_1.default.findOne({
        serviceId,
    }).lean();
    if (!locationRecord) {
        return res.status(404).json({
            status: "error",
            message: "Location not found",
        });
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, locationRecord.lastLocations, "SP location fetched successfully");
});
