import express, { Router } from "express";
import {
  loginUser,
  startRegistration,
  completeRegistration,
  refreshAccessToken,
  CheckJWTTokenExpiration,
  logoutUser,
  forgetPassword,
  resetPassword,
  verifyServiceProvider,
} from "../controller/auth/auth.controller";
import { sendMailController, verifyEmail } from "../../utils/sendEmail";
import { sendOTP, verifyOTP } from "../controller/otp.controller";
import {
  getNearbyPlaces,
  getPlaceDetailsById,
  getPlacesAutocomplete,
} from "../controller/googleapis.controller";
import { VerifyJWTToken, verifyUserType } from "../middlewares/auth/userAuth";
import { getCardValue } from "../controller/user.controller";
import { storeFcmToken } from "../../utils/sendPushNotification.utils";

const router: Router = express.Router();

//save-fcm
router.route("/store-fcm-token").post(storeFcmToken);


//sign-up
router.route("/start-registration").post(startRegistration);

router.route("/complete-registration").post(completeRegistration);
router.route("/send-mail").post(sendMailController);
router.route("/verify-mail").post(verifyEmail);

//login or sign-in route
router.route("/signin").post(loginUser);

//send otp route
router.route("/send-otp").post(sendOTP);

//send otp route
router.route("/verify-otp").post(verifyOTP);

//find near place recommendations
router.route("/get-recommendations").post(getNearbyPlaces);

//find near place recommendations
router.route("/get-place-details-by-id").post(getPlaceDetailsById);

//forget-password
router.route("/forget-password").post(forgetPassword);

router.route("/reset-password").post(resetPassword);

// router.route("/get ride-estimate").post(getRideEstimate);

/***************************** secured routes *****************************/
router.use(VerifyJWTToken);

//fetch autocolpete address
router.route("/get-autocomplete-address").post(getPlacesAutocomplete);

// Refresh token routes
router.route("/refresh-token").post(
  // rateLimiter,
  refreshAccessToken
);

//check-token-expiration
router.route("/check-token-expiration").get(CheckJWTTokenExpiration);

//verify service provider
router
  .route("/verify-sp/:serviceProviderId")
  .post(verifyUserType(["SuperAdmin"]), verifyServiceProvider);

// // Logout
router.route("/logout").post(
  // rateLimiter,
  [VerifyJWTToken],
  logoutUser
);

// router.route('/save-fcm-token').post(
//     rateLimiter,
//     [VerifyJWTToken],
//     saveFcmToken
// );

router.route('/get-card-value').get(
    [VerifyJWTToken],
    verifyUserType(["SuperAdmin"]),
    getCardValue
);

export default router;
