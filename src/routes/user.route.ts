import express, { Router } from "express";
import {
  getSingleUser,
  getAllCustomer,
  getAllProviders,
  giveRating,
  updateSp,
  updateCustomer,
  fetchAllActiveSps,
} from "../controller/user.controller";
import { VerifyJWTToken, verifyUserType } from "../middlewares/auth/userAuth";
import { fetchTopPerformerSPs, getSavedDestination } from "../controller/towingServiceBooking.controller";

const router: Router = express.Router();

router.route("/fetch-single-user").get(getSingleUser);
router.route("/fetch-customers").get(getAllCustomer);
router.route("/fetch-poviders").get(getAllProviders);
router.route("/fetch-top-performing-poviders").get(fetchTopPerformerSPs);
router.route("/fetch-active-sps").get(fetchAllActiveSps);

router.use(VerifyJWTToken);

router.route("/give-rating").post(verifyUserType(["Customer"]), giveRating);
router.route("/update-sp").post(verifyUserType(["ServiceProvider"]), updateSp);
router
  .route("/update-customer")
  .post(verifyUserType(["Customer"]), updateCustomer);

router
  .route("/fetch-saved-destinations")
  .get(verifyUserType(["Customer"]), getSavedDestination);

export default router;
