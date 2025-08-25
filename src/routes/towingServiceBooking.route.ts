import express, { Router } from "express";
import {
  bookTowingService,
  fetchTowingServiceRequest,
  acceptServiceRequest,
  declineServicerequest,
} from "../controller/towingServiceBooking.controller";
import { VerifyJWTToken, verifyUserType } from "../middlewares/auth/userAuth";

const router: Router = express.Router();

router.use(VerifyJWTToken);

router.route("/book-towing-service").post(bookTowingService);
// router.route('/enable-location').post(enableLocation);
router.route("/fetch-nearby-service-request").get(fetchTowingServiceRequest);

router
  .route("/decline-service-request")
  .post(verifyUserType(["ServiceProvider"]), declineServicerequest);

//for sp
router
  .route("/accept-service-request")
  .post(verifyUserType(["ServiceProvider"]), acceptServiceRequest);

export default router;
