import { Request, Response } from "express";
import UserModel from "../../models/user.model";
import { IUser } from "../../../types/schemaTypes";
import mongoose, { ObjectId } from "mongoose";
import { asyncHandler } from "../../../utils/asyncHandler.utils";
import { handleResponse } from "../../../utils/response.utils";
import { generateAccessToken } from "../../../utils/createToken.utils";
import AdditionalInfoModel from "../../models/additionalInfo.model";
import { CustomRequest } from "../../../types/commonType";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ApiResponse } from "../../../utils/apiResponse.utils";
import { generateVerificationCode } from "../otp.controller";
import path from "path";
import { readFile } from "fs";
import { sendMail } from "../../../utils/sendEmail";
import EmailCodeModel from "../../models/emailCode.model";
import twilio from "twilio";
import {
  FIREBASE_AUTH_PROVIDER_CERT_URL,
  FIREBASE_AUTH_URI,
  FIREBASE_CLIENT_CERT_URL,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_CLIENT_ID,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_PRIVATE_KEY_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_TOKEN_URI,
  FIREBASE_TYPE,
  FIREBASE_UNIVERSE_DOMAIN,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} from "../../config/config";
import OTPModel from "../../models/otp.model";
import additionalInfoModel from "../../models/additionalInfo.model";
import towingServiceBookingModel from "../../models/towingServiceBooking.model";
const accountSid = TWILIO_ACCOUNT_SID;
const authToken = TWILIO_AUTH_TOKEN;
let client = twilio(accountSid, authToken);
import {
  firestore,
  FirestoreAdmin,
} from "../../../utils/sendPushNotification.utils";

// fetchUserData func.
export const fetchUserData = async (userId: string | ObjectId) => {
  console.log("Api runs...: fetchUserData");

  const user = await UserModel.aggregate([
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
};

// Set cookieOption
export const cookieOption: {
  httpOnly: boolean;
  secure: boolean;
  maxAge: number;
  sameSite: "lax" | "strict" | "none";
} = {
  httpOnly: true,
  secure: true,
  maxAge: 24 * 60 * 60 * 1000, // 1 Day
  sameSite: "strict",
};

// register user controller
export const startRegistration = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: startRegistration");

    const userData = req.body;
    let newUser;

    const {
      fullName,
      email,
      countryCode,
      phone,
      userType,
      avatar,
      vehicleRegistrationNumber,
      driverLicense,
      driverLicenseImage,
      insuranceNumber,
      insuranceImage,
    } = userData;
    console.log({ userData });

    if (phone) {
      const existingPhone = await UserModel.findOne({
        isDeleted: false,
        phone,
        userType,
      });
      if (existingPhone) {
        throw handleResponse(
          res,
          "error",
          409,
          "",
          "User with phone already exists",
        );
      }
    }

    if (email) {
      const existingEmail = await UserModel.findOne({ email, userType });
      if (existingEmail) {
        throw handleResponse(
          res,
          "error",
          409,
          "",
          "User with email already exists",
        );
      }
    }

    if (userType === "ServiceProvider") {
      newUser = await UserModel.create({
        fullName,
        email,
        countryCode,
        phone,
        userType,
        avatar,
        vehicleRegistrationNumber,
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
      await new AdditionalInfoModel(addInfoData).save();
    } else {
      newUser = await UserModel.create({
        fullName,
        email,
        countryCode,
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
  },
);

export const completeRegistration = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: completeRegistration");

    const { phone, password, userType } = req.body;
    console.log(req.body);

    if (!phone || !password || !userType) {
      return handleResponse(
        res,
        "error",
        400,
        "",
        "Phone and password are required",
      );
    }

    // Find the unregistered user
    const user = await UserModel.findOne({
      phone,
      userType,
      isDeleted:false,
      isRegistered: false,
    });

    if (!user) {
      return handleResponse(
        res,
        "error",
        404,
        "",
        "User not found or already registered",
      );
    }

    user.password = password;
    user.isRegistered = true;
    user.isOTPVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password set successfully. Registration complete.",
      data: { user: user },
    });
  },
);

// login user controller
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  console.log("Api runs...: loginUser");

  const {
    email,
    phone,
    password,
    userType,
    fcmToken,
    isAdminPanel,
  }: IUser & { isAdminPanel?: boolean; userType: Array<string> } = req.body;
  if (!userType || (!email && !phone)) {
    return handleResponse(
      res,
      "error",
      400,
      "",
      "Either email or phone number with usertype is required",
    );
  }
  if (!password) {
    return handleResponse(res, "error", 400, "", "password is required");
  }
  console.log({ email });
  console.log({ phone });

  const user = await UserModel.findOne({
    $or: [{ email }, { phone }],
    userType,
    isDeleted: false,
  });
  if (!user) {
    return handleResponse(res, "error", 400, "", "User does not exist");
  }
  // console.log(user);
  // console.log(user.isOTPVerified);

  if (user.isBan) {
    return handleResponse(res, "error", 400, "", "Your account is banned!");
  }
  if (!user.isOTPVerified || !user.isVerified || user.isBan) {
    return handleResponse(
      res,
      "error",
      400,
      "",
      "Your account is not verified",
    );
  }

  if (userType && !userType.includes(user.userType)) {
    return handleResponse(res, "error", 400, "", "Access denied");
  }

  const userId = user._id;
  const isPasswordValid = await user.isPasswordCorrect(password);
  // console.log(isPasswordValid, "isPasswordValid");

  if (!isPasswordValid) {
    return handleResponse(res, "error", 400, "", "Invalid user credentials");
  }

  if (user.isDeleted) {
    return handleResponse(
      res,
      "error",
      400,
      "",
      "Your account is banned from  this platform.",
    );
  }

  // Check for admin panel access
  if (isAdminPanel) {
    const allowedAdminTypes = ["SuperAdmin", "Admin", "Finance"];
    if (!allowedAdminTypes.includes(user.userType)) {
      return handleResponse(
        res,
        "error",
        403,
        "",
        "Access denied. Only authorized users can log in to the admin panel.",
      );
    }
  }

  // Save FCM Token if provided
  if (fcmToken) {
    user.fcmToken = fcmToken;
    await user.save();
  }

  const { accessToken } = await generateAccessToken(res, user._id);
  const loggedInUser = await fetchUserData(user._id);
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
    const userAdditionalInfo = await AdditionalInfoModel.findOne({
      userId: user._id,
    });

    if (!userAdditionalInfo) {
      return handleResponse(
        res,
        "error",
        400,
        "",
        "Your account is created but please add address & your additional information.",
      );
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
    const loggedInUser = {
      ...filteredUser,
      additionalInfo: userAdditionalInfo || null,
    };
  }
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOption)
    .json({
      statusCode: 200,
      data: {
        user: filteredUser,
      },
      message: "User logged In successfully",
      success: true,
    });
});

export const CheckJWTTokenExpiration = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: CheckJWTTokenExpiration");
    let token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("Token is missing or empty");
      return handleResponse(res, "error", 401, "", "Unauthorized request");
    }

    const decoded = jwt.decode(token) as JwtPayload | null;

    if (!decoded || !decoded.exp) {
      return handleResponse(
        res,
        "error",
        400,
        "",
        "Invalid token or missing expiration",
      );
    }

    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const remainingTimeInSeconds = decoded.exp - currentTime;

    if (remainingTimeInSeconds <= 0) {
      return res
        .status(200)
        .json({ isExpired: true, remainingTimeInSeconds: 0 });
    }
    return res.status(200).json({ isExpired: false, remainingTimeInSeconds });
  },
);

// refreshAccessToken controller
export const refreshAccessToken = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: refreshAccessToken");

    const incomingAccessToken = req
      .header("Authorization")
      ?.replace("Bearer ", "");

    if (!incomingAccessToken) {
      return handleResponse(res, "error", 401, "", "Unauthorized request");
    }

    try {
      const decodedToken = jwt.verify(
        incomingAccessToken,
        process.env.ACCESS_TOKEN_SECRET as string,
      ) as JwtPayload;
      const user = await UserModel.findById(decodedToken?._id);

      if (!user) {
        return handleResponse(res, "error", 401, "", "Invalid access token");
      }

      if (user?.accessToken !== incomingAccessToken) {
        return handleResponse(
          res,
          "error",
          401,
          "",
          "Access token is expired or used",
        );
      }

      const cookieOption: { httpOnly: boolean; secure: boolean } = {
        httpOnly: true,
        secure: true,
      };

      const { accessToken } = await generateAccessToken(res, user._id);

      return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOption)
        .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
    } catch (exc: any) {
      return handleResponse(
        res,
        "error",
        401,
        "",
        exc.message || "Invalid access token",
      );
    }
  },
);

// logout user controller
export const logoutUser = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: logoutUser");
    if (!req.user || !req.user?._id) {
      return handleResponse(res, "error", 400, "", "User not found in request");
    }
    const userId = req.user?._id;

    await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          accessToken: "",
          fcmToken: "",
        },
      },
      { new: true },
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
    };

    return res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  },
);

export const forgetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: forgetPassword");

    const { input, userType } = req.body;
    let identifier = "";

    identifier = input.includes("@") ? "email" : "phone";

    // Find user by email or phone
    const user = await UserModel.findOne({
      userType,
      $or: [{ email: input }, { phone: input }],
    });

    if (!user) {
      return handleResponse(res, "error", 400, "", "User not found");
    }
    const code = generateVerificationCode(5);

    if (identifier === "email") {
      const verificationCode = code as any;
      const subject = "Email Verification";
      const to = input;
      const filePath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "templates",
        "verify_email.html",
      );
      let html = readFile(filePath, async function (error, html) {
        if (error) {
          throw error;
        }
        console.log({ html });
        const mailContent = html.toString();
        const updatedTemplate = mailContent
          .replace("{{email}}", to)
          .replace("{{code}}", verificationCode);

        const invokeSendMail = await sendMail(to, subject, updatedTemplate);
        if (!invokeSendMail) {
          return handleResponse(res, "error", 500, "", "Something went wrong");
        } else {
          await EmailCodeModel.findOneAndUpdate(
            {
              email: input,
            },
            {
              code: verificationCode,
            },
            {
              upsert: true,
              new: true,
            },
          );
        }
        res.end(html);
      });
    } else {
      const otp = code;
      const message = await client.messages.create({
        body: `Your OTP code is ${otp}`,
        from: TWILIO_PHONE_NUMBER,
        to: input,
      });

      if (!message) {
        return handleResponse(res, "error", 500, "Something went wrong");
      } else {
        await OTPModel.findOneAndUpdate(
          {
            userId: user._id,
          },
          {
            otp,
            phoneNumber: input,
          },
          {
            upsert: true,
            new: true,
          },
        );
      }
    }
    return handleResponse(
      res,
      "success",
      200,
      { identifier },
      "Verification code sent fsuccessfully",
    );
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Api runs...: resetPassword");

    const { input, password, userType } = req.body;
    console.log(req.body);

    if (!input) {
      return handleResponse(
        res,
        "error",
        400,
        "Either email or phone number is required",
      );
    }
    const userDetails = await UserModel.findOne({
      userType,
      $or: [{ email: input }, { phone: input }],
    });

    console.log({ userDetails });

    if (!userDetails) {
      return handleResponse(res, "error", 404, {}, "User not found");
    }

    // Update the password
    userDetails.password = req.body.password;
    await userDetails.save();
    return handleResponse(
      res,
      "success",
      200,
      {},
      "Password reset successfull",
    );
  },
);

// verifyServiceProvider controller
export const verifyServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const { serviceProviderId } = req.params;
    const { isVerified }: { isVerified: boolean } = req.body;

    if (!serviceProviderId) {
      return handleResponse(
        res,
        "error",
        400,
        "Service Provider ID is required.",
      );
    }

    if (!mongoose.Types.ObjectId.isValid(serviceProviderId)) {
      return handleResponse(res, "error", 400, "Invalid Service Provider ID.");
    }

    const results = await UserModel.findByIdAndUpdate(
      serviceProviderId,
      { $set: { isVerified } },
      { new: true },
    ).select("-password -refreshToken -__V");

    if (!results) {
      return handleResponse(res, "error", 400, "Service Provider not found.");
    }

    const additionalInfo = await additionalInfoModel.findOne({
      userId: serviceProviderId,
    });
    const message = isVerified
      ? "Service Provider profile verified successfully."
      : "Service Provider profile made unverified.";

    return handleResponse(res, "success", 200, {}, message);
  },
);

export const banUser = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { isBan, userId } = req.body;
    if (isBan) {
      const prevOngoigServices = await towingServiceBookingModel.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            $or: [
              { serviceProgess: "ServiceAccepted" },
              { serviceProgess: "ServiceStarted" },
            ],
          },
        },
      ]);

      if (prevOngoigServices && prevOngoigServices.length > 0) {
        return handleResponse(
          res,
          "error",
          400,
          "There is a service in progress, you can not ban this user",
        );
      }

      const banUser = await UserModel.findOneAndUpdate(
        {
          _id: userId,
        },
        {
          $set: {
            isBan,
            accessToken: "",
          },
        },
      );
      return handleResponse(
        res,
        "success",
        200,
        "",
        "Successfully banned the user",
      );
    } else {
      const banUser = await UserModel.findOneAndUpdate(
        {
          _id: userId,
        },
        {
          $set: {
            isBan,
          },
        },
      );
      return handleResponse(
        res,
        "success",
        200,
        "",
        "Successfully unbanned the user",
      );
    }
  },
);

export const deleteuser = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { userId } = req.body;
    const userDetails = await UserModel.findById({ _id: userId }).select(
      "userType",
    );
    console.log({ userDetails });
    const userType = userDetails?.userType;

    if (userType === "ServiceProvider") {
      const prevOngoigServices = await towingServiceBookingModel.aggregate([
        {
          $match: {
            serviceProviderId: new mongoose.Types.ObjectId(userId),
            $or: [
              { serviceProgess: "ServiceAccepted" },
              { serviceProgess: "ServiceStarted" },
            ],
          },
        },
      ]);

      if (prevOngoigServices && prevOngoigServices.length > 0) {
        return handleResponse(
          res,
          "error",
          400,
          "There is a service in progress, you can not delete this user",
        );
      }
    } else if (userType === "Customer") {
      const RunningBookedServices = await towingServiceBookingModel.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            $or: [
              { serviceProgess: "Booked" },
              { serviceProgess: "ServiceAccepted" },
              { serviceProgess: "ServiceStarted" },
            ],
          },
        },
      ]);

      if (RunningBookedServices && RunningBookedServices.length > 0) {
        return handleResponse(
          res,
          "error",
          400,
          "There is a service in progress, you can not delete this user",
        );
      }
    } else {
      return handleResponse(res, "error", 400, {}, "UserType not found");
    }

    const updateUser = await UserModel.findOneAndDelete(
      { _id: userId },
      {
        $set: {
          isDeleted: true,
          accessToken: "",
        },
      },
    );

    return handleResponse(res, "success", 200, {}, "User deleted successfully");
  },
);

export const deletAccount = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { userId } = req.user?._id;
    const userDetails = await UserModel.findById({ _id: userId }).select(
      "userType",
    );
    console.log({ userDetails });
    const userType = userDetails?.userType;

    if (userType === "ServiceProvider") {
      const prevOngoigServices = await towingServiceBookingModel.aggregate([
        {
          $match: {
            serviceProviderId: new mongoose.Types.ObjectId(userId),
            $or: [
              { serviceProgess: "ServiceAccepted" },
              { serviceProgess: "ServiceStarted" },
            ],
          },
        },
      ]);

      if (prevOngoigServices && prevOngoigServices.length > 0) {
        return handleResponse(
          res,
          "error",
          400,
          "There is a service in progress, you can not delete your account",
        );
      }
    } else if (userType === "Customer") {
      const RunningBookedServices = await towingServiceBookingModel.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            $or: [
              { serviceProgess: "Booked" },
              { serviceProgess: "ServiceAccepted" },
              { serviceProgess: "ServiceStarted" },
            ],
          },
        },
      ]);

      if (RunningBookedServices && RunningBookedServices.length > 0) {
        return handleResponse(
          res,
          "error",
          400,
          "There is a service in progress, you can not delete your account",
        );
      }
    } else {
      return handleResponse(res, "error", 400, {}, "UserType not found");
    }

    const updateUser = await UserModel.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          isDeleted: true,
          accessToken: "",
        },
      },
    );

    await firestore.collection("fcmTokens").doc(userId).delete();

    return handleResponse(
      res,
      "success",
      200,
      {},
      "Account deleted successfully",
    );
  },
);
