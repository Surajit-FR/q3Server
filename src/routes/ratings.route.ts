import express, { Router } from "express";
import { VerifyJWTToken, verifyUserType } from "../middlewares/auth/userAuth";
import { addRating } from "../controller/rating.controller";

const router: Router = express.Router();
router.use(VerifyJWTToken);

router.route("/give-rating").post(addRating);

export default router;
