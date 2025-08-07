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
exports.resetPassword = exports.forgetPassword = exports.logoutUser = exports.refreshAccessToken = exports.CheckJWTTokenExpiration = exports.loginUser = exports.completeRegistration = exports.startRegistration = exports.cookieOption = exports.fetchUserData = void 0;
const user_model_1 = __importDefault(require("../../models/user.model"));
const asyncHandler_utils_1 = require("../../../utils/asyncHandler.utils");
const response_utils_1 = require("../../../utils/response.utils");
const createToken_utils_1 = require("../../../utils/createToken.utils");
const additionalInfo_model_1 = __importDefault(require("../../models/additionalInfo.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const apiResponse_utils_1 = require("../../../utils/apiResponse.utils");
const otp_controller_1 = require("../otp.controller");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const sendEmail_1 = require("../../../utils/sendEmail");
const emailCode_model_1 = __importDefault(require("../../models/emailCode.model"));
const twilio_1 = __importDefault(require("twilio"));
const config_1 = require("../../config/config");
const otp_model_1 = __importDefault(require("../../models/otp.model"));
const accountSid = config_1.TWILIO_ACCOUNT_SID;
const authToken = config_1.TWILIO_AUTH_TOKEN;
let client = (0, twilio_1.default)(accountSid, authToken);
// fetchUserData func.
const fetchUserData = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: fetchUserData");
    const user = yield user_model_1.default.aggregate([
        {
            $match: {
                isDeleted: false,
                _id: userId,
            },
        },
        {
            $lookup: {
                from: "permissions",
                foreignField: "userId",
                localField: "_id",
                as: "permission",
            },
        },
        {
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: "$permission",
            },
        },
        {
            $project: {
                "permission.userId": 0,
                "permission.isDeleted": 0,
                "permission.createdAt": 0,
                "permission.updatedAt": 0,
                "permission.__v": 0,
                password: 0,
                rawPassword: 0,
                refreshToken: 0,
            },
        },
    ]);
    return user;
});
exports.fetchUserData = fetchUserData;
// Set cookieOption
exports.cookieOption = {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 Day
    sameSite: "strict",
};
// register user controller
exports.startRegistration = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: startRegistration");
    const userData = req.body;
    let newUser;
    const { fullName, email, phone, userType, avatar, driverLicense, driverLicenseImage, insuranceNumber, insuranceImage, } = userData;
    if (phone) {
        const existingPhone = yield user_model_1.default.findOne({ phone, userType });
        if (existingPhone) {
            throw (0, response_utils_1.handleResponse)(res, "error", 409, "", "User with phone already exists");
        }
    }
    if (email) {
        const existingEmail = yield user_model_1.default.findOne({ email, userType });
        if (existingEmail) {
            throw (0, response_utils_1.handleResponse)(res, "error", 409, "", "User with email already exists");
        }
    }
    if (userType === "ServiceProvider") {
        newUser = yield user_model_1.default.create({
            fullName,
            email,
            phone,
            userType,
            avatar,
            driverLicense,
            driverLicenseImage,
            insuranceNumber,
            insuranceImage,
        });
        const addInfoData = {
            userId: newUser._id,
            driverLicense,
            driverLicenseImage,
            insuranceNumber,
            insuranceImage,
        };
        yield new additionalInfo_model_1.default(addInfoData).save();
    }
    else {
        newUser = yield user_model_1.default.create({
            fullName,
            email,
            phone,
            userType,
            avatar,
            isVerified: true,
        });
    }
    // console.log(newUser, "user signup data afetr db operation");
    return res.status(200).json({
        statusCode: 200,
        data: { userId: newUser._id },
        message: "User created",
        success: true,
    });
}));
exports.completeRegistration = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: completeRegistration");
    const { phone, password, userType } = req.body;
    console.log(req.body);
    if (!phone || !password || !userType) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Phone and password are required");
    }
    // Find the unregistered user
    const user = yield user_model_1.default.findOne({
        phone,
        userType,
        isRegistered: false,
    });
    if (!user) {
        return (0, response_utils_1.handleResponse)(res, "error", 404, "", "User not found or already registered");
    }
    user.password = password;
    user.isRegistered = true;
    user.isOTPVerified = true;
    yield user.save();
    return res.status(200).json({
        success: true,
        message: "Password set successfully. Registration complete.",
        data: { user: user },
    });
}));
// login user controller
exports.loginUser = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: loginUser");
    const { email, phone, password, userType, fcmToken, isAdminPanel, } = req.body;
    if (!userType || (!email && !phone)) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Either email or phone number with usertype is required");
    }
    if (!password) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "password is required");
    }
    console.log({ email });
    console.log({ phone });
    const user = yield user_model_1.default.findOne({
        $or: [{ email }, { phone }],
        userType,
        isDeleted: false,
    });
    if (!user) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "User does not exist");
    }
    // console.log(user);
    // console.log(user.isOTPVerified);
    if (!user.isOTPVerified
    // || !user.isVerified
    ) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Your account is not verified");
    }
    if (userType && !userType.includes(user.userType)) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Access denied");
    }
    const userId = user._id;
    const isPasswordValid = yield user.isPasswordCorrect(password);
    // console.log(isPasswordValid, "isPasswordValid");
    if (!isPasswordValid) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Invalid user credentials");
    }
    if (user.isDeleted) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Your account is banned from  this platform.");
    }
    // Check for admin panel access
    if (isAdminPanel) {
        const allowedAdminTypes = ["SuperAdmin", "Admin", "Finance"];
        if (!allowedAdminTypes.includes(user.userType)) {
            return (0, response_utils_1.handleResponse)(res, "error", 403, "", "Access denied. Only authorized users can log in to the admin panel.");
        }
    }
    // Save FCM Token if provided
    if (fcmToken) {
        user.fcmToken = fcmToken;
        yield user.save();
    }
    const { accessToken } = yield (0, createToken_utils_1.generateAccessToken)(res, user._id);
    const loggedInUser = yield (0, exports.fetchUserData)(user._id);
    const filteredUser = {
        _id: loggedInUser[0]._id,
        fullName: loggedInUser[0].fullName,
        userType: loggedInUser[0].userType,
        isVerified: loggedInUser[0].isVerified,
        accessToken: loggedInUser[0].accessToken,
        phone: loggedInUser[0].phone,
        email: loggedInUser[0].email,
        avatar: loggedInUser[0].avatar,
    };
    if (user.userType === "ServiceProvider") {
        // Fetch additional info and address by userId
        const userAdditionalInfo = yield additionalInfo_model_1.default.findOne({
            userId: user._id,
        });
        if (!userAdditionalInfo) {
            return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Your account is created but please add address & your additional information.");
        }
        // if (!user.isVerified) {
        //   return handleResponse(
        //     res,
        //     "error",
        //     403,
        //     "",
        //     "Your account verification is under process. Please wait for confirmation."
        //   );
        // }
        // Include address and additional info in the response
        const loggedInUser = Object.assign(Object.assign({}, filteredUser), { additionalInfo: userAdditionalInfo || null });
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, exports.cookieOption)
        .json({
        statusCode: 200,
        data: {
            user: filteredUser,
        },
        message: "User logged In successfully",
        success: true,
    });
}));
exports.CheckJWTTokenExpiration = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    console.log("Api runs...: CheckJWTTokenExpiration");
    let token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken) ||
        ((_b = req.header("Authorization")) === null || _b === void 0 ? void 0 : _b.replace("Bearer ", ""));
    if (!token) {
        console.log("Token is missing or empty");
        return (0, response_utils_1.handleResponse)(res, "error", 401, "", "Unauthorized request");
    }
    const decoded = jsonwebtoken_1.default.decode(token);
    if (!decoded || !decoded.exp) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Invalid token or missing expiration");
    }
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const remainingTimeInSeconds = decoded.exp - currentTime;
    if (remainingTimeInSeconds <= 0) {
        return res
            .status(200)
            .json({ isExpired: true, remainingTimeInSeconds: 0 });
    }
    return res.status(200).json({ isExpired: false, remainingTimeInSeconds });
}));
// refreshAccessToken controller
exports.refreshAccessToken = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Api runs...: refreshAccessToken");
    const incomingAccessToken = (_a = req
        .header("Authorization")) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
    if (!incomingAccessToken) {
        return (0, response_utils_1.handleResponse)(res, "error", 401, "", "Unauthorized request");
    }
    try {
        const decodedToken = jsonwebtoken_1.default.verify(incomingAccessToken, process.env.ACCESS_TOKEN_SECRET);
        const user = yield user_model_1.default.findById(decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken._id);
        if (!user) {
            return (0, response_utils_1.handleResponse)(res, "error", 401, "", "Invalid access token");
        }
        if ((user === null || user === void 0 ? void 0 : user.accessToken) !== incomingAccessToken) {
            return (0, response_utils_1.handleResponse)(res, "error", 401, "", "Access token is expired or used");
        }
        const cookieOption = {
            httpOnly: true,
            secure: true,
        };
        const { accessToken } = yield (0, createToken_utils_1.generateAccessToken)(res, user._id);
        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOption)
            .json(new apiResponse_utils_1.ApiResponse(200, { accessToken }, "Access token refreshed"));
    }
    catch (exc) {
        return (0, response_utils_1.handleResponse)(res, "error", 401, "", exc.message || "Invalid access token");
    }
}));
// logout user controller
exports.logoutUser = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    console.log("Api runs...: logoutUser");
    if (!req.user || !((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "User not found in request");
    }
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
    yield user_model_1.default.findByIdAndUpdate(userId, {
        $set: {
            accessToken: "",
            fcmToken: "",
        },
    }, { new: true });
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    };
    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .json(new apiResponse_utils_1.ApiResponse(200, {}, "User logged out successfully"));
}));
exports.forgetPassword = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: forgetPassword");
    const { input, userType } = req.body;
    let identifier = "";
    identifier = input.includes("@") ? "email" : "phone";
    // Find user by email or phone
    const user = yield user_model_1.default.findOne({
        userType,
        $or: [{ email: input }, { phone: input }],
    });
    if (!user) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "User not found");
    }
    const code = (0, otp_controller_1.generateVerificationCode)(5);
    if (identifier === "email") {
        const verificationCode = code;
        const subject = "Email Verification";
        const to = input;
        const filePath = path_1.default.join(__dirname, "..", "..", "..", "templates", "verify_email.html");
        let html = (0, fs_1.readFile)(filePath, function (error, html) {
            return __awaiter(this, void 0, void 0, function* () {
                if (error) {
                    throw error;
                }
                console.log({ html });
                const mailContent = html.toString();
                const updatedTemplate = mailContent
                    .replace("{{email}}", to)
                    .replace("{{code}}", verificationCode);
                const invokeSendMail = yield (0, sendEmail_1.sendMail)(to, subject, updatedTemplate);
                if (!invokeSendMail) {
                    return (0, response_utils_1.handleResponse)(res, "error", 500, "", "Something went wrong");
                }
                else {
                    yield emailCode_model_1.default.findOneAndUpdate({
                        email: input,
                    }, {
                        code: verificationCode,
                    }, {
                        upsert: true,
                        new: true,
                    });
                }
                res.end(html);
            });
        });
    }
    else {
        const otp = code;
        const message = yield client.messages.create({
            body: `Your OTP code is ${otp}`,
            from: config_1.TWILIO_PHONE_NUMBER,
            to: input,
        });
        if (!message) {
            return (0, response_utils_1.handleResponse)(res, "error", 500, "Something went wrong");
        }
        else {
            yield otp_model_1.default.findOneAndUpdate({
                userId: user._id,
            }, {
                otp,
                phoneNumber: input
            }, {
                upsert: true,
                new: true,
            });
        }
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, { identifier }, "Verification code sent fsuccessfully");
}));
exports.resetPassword = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Api runs...: resetPassword");
    const { input, password, userType } = req.body;
    console.log(req.body);
    if (!input) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "Either email or phone number is required");
    }
    const userDetails = yield user_model_1.default.findOne({
        userType,
        $or: [{ email: input }, { phone: input }],
    });
    console.log({ userDetails });
    if (!userDetails) {
        return (0, response_utils_1.handleResponse)(res, "error", 404, {}, "User not found");
    }
    // Update the password
    userDetails.password = req.body.password;
    yield userDetails.save();
    return (0, response_utils_1.handleResponse)(res, "success", 200, {}, "Password reset successfull");
}));
