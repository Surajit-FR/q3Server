import express, { Router } from "express";
import {
  bookTowingService,
  fetchTowingServiceRequest,
  acceptServiceRequest,
  declineServicerequest,
  getUserServiceDetilsByState,
  fetchTotalServiceByAdmin,
  fetchTotalServiceBySp,
  fetchSingleService,
  cancelServiceBySP,
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

router
  .route("/fetch-customer-request-progresswise")
  .post(verifyUserType(["Customer"]), getUserServiceDetilsByState);

router
  .route("/fetch-all-request")
  .get(verifyUserType(["SuperAdmin"]), fetchTotalServiceByAdmin);

router
  .route("/fetch-request-progresswise-bysp")
  .post(verifyUserType(["ServiceProvider"]), fetchTotalServiceBySp);

router
  .route("/fetch-single-request/:serviceId")
  .get(
    verifyUserType(["ServiceProvider", "SuperAdmin", "Customer"]),
    fetchSingleService
  );
router
  .route("/cancel-service-bysp")
  .post(
    verifyUserType(["ServiceProvider"]),
    cancelServiceBySP
  );

export default router;
