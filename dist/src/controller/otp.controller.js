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
exports.verifyOTP = exports.sendOTP = exports.generateVerificationCode = void 0;
const twilio_1 = __importDefault(require("twilio"));
const otp_model_1 = __importDefault(require("../models/otp.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const config_1 = require("../config/config");
const response_utils_1 = require("../../utils/response.utils");
const mongoose_1 = __importDefault(require("mongoose"));
const accountSid = config_1.TWILIO_ACCOUNT_SID;
const authToken = config_1.TWILIO_AUTH_TOKEN;
// const authToken = "";
let client = (0, twilio_1.default)(accountSid, authToken);
const generateVerificationCode = (length) => {
    console.log("function runs...: generateVerificationCode");
    if (length <= 0) {
        throw new Error("Length must be greater than 0");
    }
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1));
};
exports.generateVerificationCode = generateVerificationCode;
exports.sendOTP = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    console.log(/^\+\d{1,3}\d{7,15}$/.test(`${countryCode}${phoneNumber}`), "phone");
    // Validate phone number format
    // if (!/^\+\d{1,3}\d{7,15}$/.test(`${countryCode}${phoneNumber}`)) {
    //   return handleResponse(res, "error", 400, "", "Invalid phone number format");
    // }
    const otpLength = 5;
    const otp = (0, exports.generateVerificationCode)(otpLength);
    const expiredAt = new Date(Date.now() + stepDuration * 1000);
    if (purpose !== "verifyPhone") {
        const user = yield user_model_1.default.findOne({
            phone: phoneNumber,
            userType,
            isDeleted: false,
        });
        if (!user) {
            return (0, response_utils_1.handleResponse)(res, "error", 400, "", "User does not exist");
        }
        const userId = user._id;
        const otpEntry = new otp_model_1.default({
            userId,
            phoneNumber: phoneNumber,
            otp,
            expiredAt,
        });
        yield otpEntry.save();
    }
    else {
        const otpEntry = new otp_model_1.default({
            userId: new mongoose_1.default.Types.ObjectId(),
            phoneNumber: phoneNumber,
            otp,
            expiredAt,
        });
        yield otpEntry.save();
    }
    const message = yield client.messages.create({
        body: `Your OTP code is ${otp}`,
        from: config_1.TWILIO_PHONE_NUMBER,
        to: `${countryCode}${phoneNumber}`,
    });
    return (0, response_utils_1.handleResponse)(res, "success", 201, "", "Otp sent successfully");
}));
exports.verifyOTP = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: verifyOTP");
    const { phoneNumber, otp, purpose } = req.body;
    console.log("verify otp payload", req.body);
    if (!phoneNumber || !otp || !purpose) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "phoneNumber, otp, and purpose are required");
    }
    const otpEntry = yield otp_model_1.default.findOne({ phoneNumber });
    // Set default OTP for testing in non-production environments
    const defaultOtp = "00000";
    const isOtpValid = (otpEntry === null || otpEntry === void 0 ? void 0 : otpEntry.otp.toString()) === otp; //this is for live mode
    // const isOtpValid = defaultOtp === otp;
    console.log({ isOtpValid });
    console.log({ otpEntry });
    console.log({ otp });
    if (!isOtpValid) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "Invalid OTP");
    }
    else {
        yield otp_model_1.default.deleteOne({ _id: otpEntry === null || otpEntry === void 0 ? void 0 : otpEntry._id });
    }
    switch (purpose) {
        case "forgetPassword": {
            return (0, response_utils_1.handleResponse)(res, "success", 200, "", "OTP Verified Successfully");
        }
        case "endJob":
            return (0, response_utils_1.handleResponse)(res, "success", 200, "", "OTP Verified Successfully");
        case "verifyPhone":
            return (0, response_utils_1.handleResponse)(res, "success", 200, "", "OTP Verified Successfully");
        default:
            return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Invalid purpose");
    }
}));
