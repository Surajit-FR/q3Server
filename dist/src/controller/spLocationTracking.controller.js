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
exports.getSPLocation = exports.updateSPLocation = void 0;
const spLocationTracking_model_1 = __importDefault(require("../models/spLocationTracking.model"));
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const response_utils_1 = require("../../utils/response.utils");
exports.updateSPLocation = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const updatedDoc = yield spLocationTracking_model_1.default.findOneAndUpdate({ spId, serviceId }, {
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
}));
exports.getSPLocation = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { serviceId } = req.params;
    const locationRecord = yield spLocationTracking_model_1.default.findOne({
        serviceId,
        spId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
    }).lean();
    if (!locationRecord) {
        return res.status(404).json({
            status: "error",
            message: "Location not found",
        });
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, locationRecord.lastLocations, "SP location fetched successfully");
}));
