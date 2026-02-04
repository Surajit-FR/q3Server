import express, { Router } from "express";
import { VerifyJWTToken } from "../middlewares/auth/userAuth";
import { fetchQueryMessage, sendQueryMessage } from "../controller/contactUs.controller";

const router: Router = express.Router();

router.use(VerifyJWTToken);

router.route("/send-query").post(sendQueryMessage);
router.route("/fetch-queries").get(fetchQueryMessage);

export default router;
