"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controller/auth/auth.controller");
const sendEmail_1 = require("../../utils/sendEmail");
const otp_controller_1 = require("../controller/otp.controller");
const googleapis_controller_1 = require("../controller/googleapis.controller");
const userAuth_1 = require("../middlewares/auth/userAuth");
const user_controller_1 = require("../controller/user.controller");
const sendPushNotification_utils_1 = require("../../utils/sendPushNotification.utils");
const router = express_1.default.Router();
//save-fcm
router.route("/store-fcm-token").post(sendPushNotification_utils_1.storeFcmToken);
//sign-up
router.route("/start-registration").post(auth_controller_1.startRegistration);
router.route("/complete-registration").post(auth_controller_1.completeRegistration);
router.route("/send-mail").post(sendEmail_1.sendMailController);
router.route("/verify-mail").post(sendEmail_1.verifyEmail);
//login or sign-in route
router.route("/signin").post(auth_controller_1.loginUser);
//send otp route
router.route("/send-otp").post(otp_controller_1.sendOTP);
//send otp route
router.route("/verify-otp").post(otp_controller_1.verifyOTP);
//find near place recommendations
router.route("/get-recommendations").post(googleapis_controller_1.getNearbyPlaces);
//find near place recommendations
router.route("/get-place-details-by-id").post(googleapis_controller_1.getPlaceDetailsById);
//forget-password
router.route("/forget-password").post(auth_controller_1.forgetPassword);
router.route("/reset-password").post(auth_controller_1.resetPassword);
// router.route("/get ride-estimate").post(getRideEstimate);
/***************************** secured routes *****************************/
router.use(userAuth_1.VerifyJWTToken);
//fetch autocolpete address
router.route("/get-autocomplete-address").post(googleapis_controller_1.getPlacesAutocomplete);
// Refresh token routes
router.route("/refresh-token").post(
// rateLimiter,
auth_controller_1.refreshAccessToken);
//check-token-expiration
router.route("/check-token-expiration").get(auth_controller_1.CheckJWTTokenExpiration);
//verify service provider
router
    .route("/verify-sp/:serviceProviderId")
    .post((0, userAuth_1.verifyUserType)(["SuperAdmin"]), auth_controller_1.verifyServiceProvider);
// // Logout
router.route("/logout").post(
// rateLimiter,
[userAuth_1.VerifyJWTToken], auth_controller_1.logoutUser);
// router.route('/save-fcm-token').post(
//     rateLimiter,
//     [VerifyJWTToken],
//     saveFcmToken
// );
router.route('/get-card-value').get([userAuth_1.VerifyJWTToken], (0, userAuth_1.verifyUserType)(["SuperAdmin"]), user_controller_1.getCardValue);
exports.default = router;
