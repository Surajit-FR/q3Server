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
exports.stripeWebhook = void 0;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = require("../config/config");
const towingServiceBooking_model_1 = __importDefault(require("../models/towingServiceBooking.model"));
const stripe = new stripe_1.default(config_1.STRIPE_SECRET_KEY, {
    apiVersion: "2024-09-30.acacia",
});
const stripeWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("webhook runs");
    const sig = req.headers["stripe-signature"];
    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, config_1.STRIPE_WEBHOOK_SECRET);
        console.log("given event details==>", event);
        switch (event.type) {
            case "checkout.session.completed":
                handleSuccess(event.data.object);
                break;
            case "payment_intent.payment_failed":
                handleFailure(event.data.object);
                break;
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error("Webhook Error:", error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});
exports.stripeWebhook = stripeWebhook;
function handleSuccess(session) {
    return __awaiter(this, void 0, void 0, function* () {
        const serviceId = session.metadata.serviceId;
        const customerId = session.customer;
        console.log("Payment Successful for session:", session.id);
        yield towingServiceBooking_model_1.default.findByIdAndUpdate(serviceId, {
            isPaymentComplete: true,
            paymentIntentId: session.payment_intent,
            serviceProgess: "ServiceCompleted"
        });
    });
}
function handleFailure(paymentIntent) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const serviceId = (_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.serviceId;
        console.log(" Payment Failed for Intent:", paymentIntent.id);
        if (serviceId) {
            yield towingServiceBooking_model_1.default.findByIdAndUpdate(serviceId, {
                isPaymentComplete: false,
            });
        }
    });
}
