import { NextFunction, Request, Response } from "express";
export type DBInfo = {
    STATUS: string,
    HOST: string,
    DATE_TIME: string,
};
export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export interface CustomRequest extends Request {
    user?: IUser;
    ipAddress?: string;
};
