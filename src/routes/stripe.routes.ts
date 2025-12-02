import express, { Router } from "express";

// import { stripeWebhook } from "../controller/webhook.controller";
import { VerifyJWTToken } from "../middlewares/auth/userAuth";
import { createCheckoutsession } from "../controller/stripe.controller";

const router: Router = express.Router();

//STRIPE API ROUTES
router.use(VerifyJWTToken);

router.post("/create-checkout-session",createCheckoutsession);



export default router;
