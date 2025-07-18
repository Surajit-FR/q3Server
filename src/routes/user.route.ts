import express, { Router } from "express";
import {
  getSingleUser,
  getAllCustomer,
  getAllProviders,
  giveRating,
} from "../controller/user.controller";
import { VerifyJWTToken, verifyUserType } from "../middlewares/auth/userAuth";

const router: Router = express.Router();

router.route("/fetch-single-user").get(getSingleUser);
router.route("/fetch-customers").get(getAllCustomer);
router.route("/fetch-poviders").get(getAllProviders);

router.use(VerifyJWTToken);


router.route("/give-rating").post(verifyUserType(["Customer"]), giveRating);


export default router;
