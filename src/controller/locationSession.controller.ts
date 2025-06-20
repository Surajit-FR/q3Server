import { Request, Response } from "express";
import { CustomRequest } from "../../types/commonType";
import { asyncHandler } from "../../utils/asyncHandler.utils";
import { handleResponse } from "../../utils/response.utils";
import LocationSessionModel from "../models/locationSession.models";

// Utility to convert seconds to a readable format
function formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hrs}h ${mins}m ${secs}s`;
}



export const enableLocation = asyncHandler(async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { location, latitude, longitude } = req.body;

    if (!userId) {
        return handleResponse(res, "error", 401, "", "Unauthorized: User not found")
    }

    // Check for an existing active session
    const activeSession = await LocationSessionModel.findOne({
        userId,
        isActive: true,
    });

    if (activeSession) {
        return handleResponse(res, "success", 200, activeSession, "Location already enabled")
    }

    // Create a new location session
    const newSession = await LocationSessionModel.create({
        userId,
        location,
        latitude,
        longitude,
        startedAt: new Date(),
    });

    return handleResponse(res, "success", 201, newSession, "Location enabled and session started");
});


export const disableLocation = asyncHandler(async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const activeSession = await LocationSessionModel.findOne({
        userId,
        isActive: true,
    });

    if (!activeSession) {
        return res.status(400).json({ message: "No active location session found" });
    }

    const endedAt = new Date();
    const duration = (endedAt.getTime() - activeSession.startedAt.getTime()) / 1000; // in seconds

    activeSession.endedAt = endedAt;
    activeSession.duration = duration;
    activeSession.isActive = false;

    await activeSession.save();

    return res.status(200).json({
        message: "Location disabled and session ended",
        // session: activeSession,
    });
});

export const getTotalOnlineTime = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query?.userId;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const sessions = await LocationSessionModel.find({
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
});

