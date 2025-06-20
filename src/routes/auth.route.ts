
import express, { Router } from "express";
import {
    loginUser,
    startRegistration,
    completeRegistration
} from "../controller/auth/auth.controller";
import { sendMailController, verifyEmail } from "../../utils/sendEmail";
import { sendOTP, verifyOTP } from "../controller/otp.controller";
import { getNearbyPlaces } from "../controller/googleapis.controller";






const router: Router = express.Router();


//sign-up
router.route('/start-registration').post(
    startRegistration,
);

router.route('/complete-registration').post(
    completeRegistration,
);
router.route('/send-mail').post(
    sendMailController,
);
router.route('/verify-mail').post(verifyEmail);


//login or sign-in route
router.route('/signin').post(
    loginUser
);

//send otp route
router.route('/send-otp').post(sendOTP);

//send otp route
router.route('/verify-otp').post(verifyOTP);

//find near place recommendations
router.route('/get-recommendations').post(getNearbyPlaces);


/***************************** secured routes *****************************/
// Logout
// router.route('/save-fcm-token').post(
//     rateLimiter,
//     [VerifyJWTToken],
//     saveFcmToken
// );
// // Logout
// router.route('/logout').post(
//     rateLimiter,
//     [VerifyJWTToken],
//     logoutUser
// );
// router.route('/add-associate').post(
//     rateLimiter,
//     [VerifyJWTToken],
//     verifyUserType(["ServiceProvider", 'TeamLead']),
//     addAssociate
// );

// // Refresh token routes
// router.route('/refresh-token').post(
//     rateLimiter,
//     refreshAccessToken
// );

// router.route("/forget-password").post(forgetPassword);
// router.route("/reset-password").post(resetPassword);

// //check-token-expiration
// router.route("/check-token-expiration").get( CheckJWTTokenExpiration);


export default router;


