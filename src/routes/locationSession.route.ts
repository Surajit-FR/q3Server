import express, { Router } from "express";
import {
  enableLocation,
  disableLocation,
  getTotalOnlineTime,
  isLocationenabled,
} from "../controller/locationSession.controller";

import {
  getSPLocation,
  updateSPLocation,
} from "../controller/spLocationTracking.controller";
import { VerifyJWTToken } from "../middlewares/auth/userAuth";

const router: Router = express.Router();

router.use(VerifyJWTToken);

router.route("/is-location-enabled").get(isLocationenabled);
router.route("/enable-location").post(enableLocation);
router.route("/disable-location").get(disableLocation);
router.route("/get-total-online_duration").get(getTotalOnlineTime);

//sp location tracking routes
router.route("/update-sp-location").post(updateSPLocation);
router.route("/fetch-sp-location").post(getSPLocation);

export default router;
