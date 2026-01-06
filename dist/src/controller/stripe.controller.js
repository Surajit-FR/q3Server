"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutsession = void 0;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = require("../config/config");
const user_model_1 = __importDefault(require("../models/user.model"));
const qrcode_1 = __importDefault(require("qrcode"));
const towingServiceBooking_model_1 = __importDefault(require("../models/towingServiceBooking.model"));
const stripe = new stripe_1.default(config_1.STRIPE_SECRET_KEY, {
    apiVersion: "2024-09-30.acacia",
});
//session for towing service payment payment
const createCheckoutsession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { amount, serviceId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const currency = "usd";
        const user = yield user_model_1.default.findById(userId);
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = yield stripe.customers.create({
                email: user.email,
                name: `${user.fullName}`,
            });
            stripeCustomerId = customer.id;
            yield user_model_1.default.findByIdAndUpdate(userId, { stripeCustomerId });
        }
        const session = yield stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer: stripeCustomerId,
            line_items: [
                {
                    price_data: {
                        currency,
                        unit_amount: amount * 100,
                        product_data: {
                            name: "Service Payment",
                        },
                    },
                    quantity: 1,
                },
            ],
            payment_intent_data: {
                description: `Towing service fee_paid_by_customer_${userId === null || userId === void 0 ? void 0 : userId.toString()}_for_service_${serviceId}`,
                setup_future_usage: "on_session",
            },
            payment_method_data: {
                allow_redisplay: "always",
            },
            payment_method_options: {
                card: {
                    request_three_d_secure: "any",
                },
            },
            metadata: {
                serviceId,
            },
            success_url: "https://frontend.theassure.co.uk/payment-success",
            cancel_url: "https://frontend.theassure.co.uk/payment-error",
        });
        console.log({ Incentivesession: session });
        const paymentUrl = session.url || "";
        const paymentQR = yield qrcode_1.default.toDataURL(paymentUrl);
        yield towingServiceBooking_model_1.default.findByIdAndUpdate(serviceId, {
            isPaymentComplete: true,
            paymentIntentId: session.payment_intent,
            serviceProgess: "ServiceCompleted"
        });
        res.json({ paymentQR });
    }
    catch (error) { }
});
exports.createCheckoutsession = createCheckoutsession;
