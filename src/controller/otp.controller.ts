import twilio from "twilio";
import OTPModel from "../models/otp.model";
import UserModel from "../models/user.model";
import { asyncHandler } from "../../utils/asyncHandler.utils";
import { Request, Response } from "express";
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} from "../config/config";
import { handleResponse } from "../../utils/response.utils";
import mongoose from "mongoose";

const accountSid = TWILIO_ACCOUNT_SID;
const authToken = TWILIO_AUTH_TOKEN;

// const authToken = "";
let client = twilio(accountSid, authToken);

export const generateVerificationCode = (length: number): number => {
  console.log("function runs...: generateVerificationCode");

  if (length <= 0) {
    throw new Error("Length must be greater than 0");
  }
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1));
};
export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
  console.log("Api runs...: sendOTP");

  const { countryCode, phoneNumber, purpose, userType } = req.body; //phone number with country code
  console.log(req.body);

  if (!phoneNumber) {
    return res
      .status(400)
      .json({ success: false, message: "phoneNumber are required" });
  }

  let stepDuration = 4 * 60;
  if (purpose === "service") {
    stepDuration = 24 * 60 * 60;
  }

  console.log(
    /^\+\d{1,3}\d{7,15}$/.test(`${countryCode}${phoneNumber}`),
    "phone"
  );

  // Validate phone number format
  // if (!/^\+\d{1,3}\d{7,15}$/.test(`${countryCode}${phoneNumber}`)) {
  //   return handleResponse(res, "error", 400, "", "Invalid phone number format");
  // }

  const otpLength = 5;
  const otp = generateVerificationCode(otpLength);

  const expiredAt = new Date(Date.now() + stepDuration * 1000);

  if (purpose !== "verifyPhone") {
    const user = await UserModel.findOne({
      phone: phoneNumber,
      userType,
      isDeleted: false,
    });
    if (!user) {
      return handleResponse(res, "error", 400, "", "User does not exist");
    }
    const userId = user._id;
    const otpEntry = new OTPModel({
      userId,
      phoneNumber: phoneNumber,
      otp,
      expiredAt,
    });
    await otpEntry.save();
  } else {
    const otpEntry = new OTPModel({
      userId: new mongoose.Types.ObjectId(),
      phoneNumber: phoneNumber,
      otp,
      expiredAt,
    });
    await otpEntry.save();
  }

  const message = await client.messages.create({
    body: `Your OTP code is ${otp}`,
    from: TWILIO_PHONE_NUMBER,
    to: `${countryCode}${phoneNumber}`,
  });

  return handleResponse(res, "success", 201, "", "Otp sent successfully");
});

export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  console.log("Api runs...: verifyOTP");

  const { phoneNumber, otp, purpose } = req.body;
  console.log("verify otp payload", req.body);

  if (!phoneNumber || !otp || !purpose) {
    return handleResponse(
      res,
      "error",
      400,
      "phoneNumber, otp, and purpose are required"
    );
  }
  const otpEntry = await OTPModel.findOne({ phoneNumber });

  // Set default OTP for testing in non-production environments
  const defaultOtp = "00000";

  const isOtpValid = otpEntry?.otp.toString() === otp; //this is for live mode
  // const isOtpValid = defaultOtp === otp;
  console.log({ isOtpValid });
  console.log({ otpEntry });
  console.log({ otp });

  if (!isOtpValid) {
    return handleResponse(res, "error", 400, "Invalid OTP");
  } else {
    await OTPModel.deleteOne({ _id: otpEntry?._id });
  }

  switch (purpose) {
    case "forgetPassword": {
      return handleResponse(
        res,
        "success",
        200,
        "",
        "OTP Verified Successfully"
      );
    }
    case "endJob":
      return handleResponse(
        res,
        "success",
        200,
        "",
        "OTP Verified Successfully"
      );
    case "verifyPhone":
      return handleResponse(
        res,
        "success",
        200,
        "",
        "OTP Verified Successfully"
      );

    default:
      return handleResponse(res, "error", 400, "", "Invalid purpose");
  }
});

export const sendSMS = async (to: string, countryCode: string, sms: string) => {
  try {
    console.log("function runs:...sendSMS");
    
    const message = await client.messages.create({
      body: sms,
      from: TWILIO_PHONE_NUMBER,
      to: `${countryCode}${to}`,
    });
  } catch (err: any) {
    console.log("OTP Controller Error:", err);

    if (err.code === 20404) {
      return handleResponse(
        "",
        "error",
        400,
        {},
        "Phone number not found or invalid."
      );
    } else if (err.code === 20003) {
      return handleResponse(
        "",
        "error",
        400,
        "",
        "Something went wrong... please try again later."
      );
    }
    return handleResponse(
      "",
      "error",
      500,
      {},
      "Phone lookup failed. Please try again."
    );
  }
};
