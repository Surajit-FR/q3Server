import { Request, Response, NextFunction } from 'express';
import { handleResponse } from '../../../utils/response.utils';
import { asyncHandler } from '../../../utils/asyncHandler.utils';
import jwt, { JwtPayload } from 'jsonwebtoken';
import UserModel from '../../models/user.model';
import { CustomRequest } from '../../../types/commonType';

// VerifyToken
export const VerifyJWTToken = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        let token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            console.log("Token is missing or empty");
            return handleResponse(res, "error", 401, '', 'Unauthorized Request',)
        };

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload;
        const user = await UserModel.findById(decodedToken?._id).select("-password");

        if (!user) {
            return handleResponse(res, "error", 401, '', 'Invalid access token')
        };
        req.user = user;

        next();
    } catch (error: any) {
        return handleResponse(res, "error", 401, '', 'Invalid access token')
    }
});

// verifyUserType
export const verifyUserType = (requiredUserTypes: string[] | null = null) => {
    return asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return handleResponse(res, "error", 401, '', 'Unauthorized Request')
        }

        if (requiredUserTypes && !requiredUserTypes.includes(req.user.userType)) {
            return handleResponse(res, "error", 403, '', 'Access denied. Requires one of the following roles: ${requiredUserTypes.join(", ")}.`)')
        }

        next();
    });
};