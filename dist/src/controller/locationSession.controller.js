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
exports.isLocationenabled = exports.getTotalOnlineTime = exports.disableLocation = exports.enableLocation = void 0;
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const response_utils_1 = require("../../utils/response.utils");
const locationSession_models_1 = __importDefault(require("../models/locationSession.models"));
// Utility to convert seconds to a readable format
function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
}
exports.enableLocation = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Api runs...: enableLocation");
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { location, latitude, longitude } = req.body;
    if (!userId) {
        return (0, response_utils_1.handleResponse)(res, "error", 401, "", "Unauthorized: User not found");
    }
    // Check for an existing active session
    const activeSession = yield locationSession_models_1.default.findOne({
        userId,
        isActive: true,
    });
    if (activeSession) {
        return (0, response_utils_1.handleResponse)(res, "success", 200, activeSession, "Location already enabled");
    }
    // Create a new location session
    const newSession = yield locationSession_models_1.default.create({
        userId,
        location,
        latitude,
        longitude,
        startedAt: new Date(),
    });
    return (0, response_utils_1.handleResponse)(res, "success", 201, newSession, "Location enabled and session started");
}));
exports.disableLocation = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Api runs...: disableLocation");
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User not found" });
    }
    const activeSession = yield locationSession_models_1.default.findOne({
        userId,
        isActive: true,
    });
    if (!activeSession) {
        return res
            .status(400)
            .json({ message: "No active location session found" });
    }
    const endedAt = new Date();
    const duration = (endedAt.getTime() - activeSession.startedAt.getTime()) / 1000; // in seconds
    activeSession.endedAt = endedAt;
    activeSession.duration = duration;
    activeSession.isActive = false;
    yield activeSession.save();
    return res.status(200).json({
        message: "Location disabled and session ended",
        // session: activeSession,
    });
}));
exports.getTotalOnlineTime = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Api runs...: getTotalOnlineTime");
    const userId = (_a = req.query) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    const sessions = yield locationSession_models_1.default.find({
        userId,
        duration: { $exists: true },
    });
    const totalDurationSeconds = sessions.reduce((acc, session) => acc + (session.duration || 0), 0);
    return res.status(200).json({
        message: "Total location-based online time fetched successfully",
        totalDurationSeconds,
        readable: formatDuration(totalDurationSeconds),
        sessionCount: sessions.length,
    });
}));
exports.isLocationenabled = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Api runs...: isLocationenabled");
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    console.log({ userId });
    if (!userId) {
        return (0, response_utils_1.handleResponse)(res, "error", 401, "", "Unauthorized: User not found");
    }
    // Check for an existing active session
    const activeSession = yield locationSession_models_1.default.findOne({
        userId,
        isActive: true,
    });
    if (activeSession) {
        return (0, response_utils_1.handleResponse)(res, "success", 200, activeSession, "Location already enabled");
    }
    else {
        return (0, response_utils_1.handleResponse)(res, "success", 200, activeSession, "No active location session found");
    }
}));
