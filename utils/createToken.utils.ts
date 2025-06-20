import { Response } from "express";
import { ObjectId } from "mongoose";
import { handleResponse } from "./response.utils";
import userModel from '../src/models/user.model';

export const generateAccessToken = async (res: Response, userId: string | ObjectId): Promise<{ accessToken: string | undefined; }> => {
    try {
        
        const user = await userModel.findById(userId);
        console.log("user",user);
        const accessToken = user?.generateAccessToken();

        if (!user) {
            throw handleResponse(res, 'error', 400, "", "User Not Found");
        }
        user.accessToken = accessToken;
        await user?.save({ validateBeforeSave: false });

        return { accessToken };

    } catch (err) {
        throw handleResponse(res, 'error', 500, "", "Something went wrong while generating refresh and access token");
    };
};


