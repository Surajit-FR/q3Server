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
exports.squareWebhook = void 0;
const express_1 = __importDefault(require("express"));
const config_1 = require("../config/config");
const square_1 = require("square");
const square_2 = require("square"); // Use 'square' for the new SDK
const config_2 = require("../config/config"); // Replace with the key from Step 2
const towingServiceBooking_model_1 = __importDefault(require("../models/towingServiceBooking.model"));
const client = new square_1.SquareClient({
    environment: square_1.SquareEnvironment.Sandbox,
    token: config_1.SQUARE_ACCESS_TOKEN,
});
const app = (0, express_1.default)();
app.use(express_1.default.raw({ type: "application/json" }));
const squareWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("webhook runs");
    try {
        const signature = req.headers["x-square-hmacsha256-signature"];
        const rawBody = req.body; // The raw body as a Buffer
        // Verify the signature
        const isVerified = yield square_2.WebhooksHelper.verifySignature({
            requestBody: rawBody,
            signatureHeader: signature,
            signatureKey: config_2.SQUARE_SIGNATURE_KEY,
            notificationUrl: config_2.SQUARE_NOTIFICATION_URL,
        });
        if (isVerified) {
            // Process the event
            const event = JSON.parse(rawBody.toString());
            console.log("Received verified webhook event:", event.event_type);
            if (event.type === "payment.updated") {
                const payment = event.data.object.payment;
                if (payment.status === "COMPLETED") {
                    console.log("payment", payment);
                    const response = yield client.orders.get({
                        orderId: payment === null || payment === void 0 ? void 0 : payment.order_id,
                    });
                    console.log("api hitt", response);
                    const serviceId = (_a = response === null || response === void 0 ? void 0 : response.order) === null || _a === void 0 ? void 0 : _a.referenceId;
                    console.log("api serviceId", serviceId);
                    const service = yield towingServiceBooking_model_1.default.findByIdAndUpdate(serviceId, {
                        isPaymentComplete: true,
                        paymentIntentId: payment.id,
                        serviceProgess: "ServiceCompleted",
                    });
                    console.log({ service });
                }
            }
            res.json({ status: 200, msg: "Event received and verified" });
        }
        else {
            console.error("Webhook signature verification failed.");
            res.status(403).send("Verification failed");
        }
    }
    catch (error) {
        console.error("Webhook Error:", error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});
exports.squareWebhook = squareWebhook;
