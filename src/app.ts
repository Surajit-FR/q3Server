import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { EXPRESS_CONFIG_LIMIT } from "./constants";
import authRouter from "./routes/auth.route";
import imageRouter from "./routes/upload.routes";
import vehicleTypeRouter from "./routes/vehicleType.route";
import towingServiceBookingRouter from "./routes/towingServiceBooking.route";
import locationSessionRouter from "./routes/locationSession.route";
import userRouter from "./routes/user.route";


const app = express();

//  CORS Middleware
app.use(
    cors({
        origin: [process.env.CORS_ORIGIN as string, 'http://localhost:9000'],
        credentials: true,
    })
);


// General Middleware 
app.use(morgan("dev"));
app.use(express.json({ limit: EXPRESS_CONFIG_LIMIT })); // JSON Parsing for Other Routes
app.use(express.urlencoded({ extended: true, limit: EXPRESS_CONFIG_LIMIT }));
app.use(express.static("public"));
app.use(cookieParser());

//API routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/", imageRouter);
app.use("/api/v1/vehicle-type", vehicleTypeRouter);
app.use("/api/v1/service", towingServiceBookingRouter);
app.use("/api/v1/location-session", locationSessionRouter);
app.use("/api/v1/user", userRouter);




//  Ping Route for Health Check
app.get("/ping", (req: Request, res: Response) => {
    res.send("Hi!...I am server, Happy to see you boss...");
});

//  Internal Server Error Handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.log(err);
    res.status(500).json({
        status: 500,
        message: "Server Error",
        error: err.message,
    });
});

//  404 Not Found Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        status: 404,
        message: "Endpoint Not Found",
    });
});


export { app };