"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// import { stripeWebhook } from "../controller/webhook.controller";
const userAuth_1 = require("../middlewares/auth/userAuth");
const stripe_controller_1 = require("../controller/stripe.controller");
const router = express_1.default.Router();
//STRIPE API ROUTES
router.use(userAuth_1.VerifyJWTToken);
router.post("/create-checkout-session", stripe_controller_1.createCheckoutsession);
router.post("/payout-sp", stripe_controller_1.payoutServiceProvider);
router.post("/fetch-payout", stripe_controller_1.fetchSPPayout);
exports.default = router;
