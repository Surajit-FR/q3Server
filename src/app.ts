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
import pricingRuleRouter from "./routes/pricing.route";
import stripeRouter from "./routes/stripe.routes";
import webhookRouter from "./routes/webhook.route"
import squareRouter from "./routes/square.route";
import ratingRouter from './routes/ratings.route';
import contactUsRouter from './routes/contactUs.route';

const app = express();

//  CORS Middleware
app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN as string,
      "http://localhost:9000",
      "http://localhost:5173",
      "http://3.110.157.24",
    ],
    credentials: true,
  })
);

app.use("/api/v1/payment", express.raw({ type: "application/json" }), webhookRouter);


// General Middleware
app.use(morgan("dev"));
app.use(express.json({ limit: EXPRESS_CONFIG_LIMIT })); // JSON Parsing for Other Routes
app.use(express.urlencoded({ extended: true, limit: EXPRESS_CONFIG_LIMIT }));
app.use(express.static("public"));
app.use(cookieParser());

//Stripe routes
app.use("/api/v1/stripe", stripeRouter);

//Square routes
app.use('/api/v1/square',squareRouter)

//API routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/", imageRouter);
app.use("/api/v1/vehicle-type", vehicleTypeRouter);
app.use("/api/v1/pricing-rule", pricingRuleRouter);
app.use("/api/v1/service", towingServiceBookingRouter);
app.use("/api/v1/location-session", locationSessionRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/rating", ratingRouter);
app.use("/api/v1/contact-us", contactUsRouter);

//  Ping Route for Health Check
app.get("/api/v1/ping", (req: Request, res: Response) => {
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
