"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSquareCheckoutsession = void 0;
const square_1 = require("square");
const qrcode_1 = __importDefault(require("qrcode"));
const user_model_1 = __importDefault(require("../models/user.model"));
const config_1 = require("../config/config");
const client = new square_1.SquareClient({
    environment: square_1.SquareEnvironment.Sandbox,
    token: config_1.SQUARE_ACCESS_TOKEN,
});
//session for towing service payment payment
const createSquareCheckoutsession = async (req, res) => {
    var _a, _b, _c;
    try {
        const { amount, serviceId } = req.body;
        console.log(req.body);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const user = await user_model_1.default.findById(userId);
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        const session = await client.checkout.paymentLinks.create({
            idempotencyKey: crypto.randomUUID(),
            order: {
                locationId: "L7CDHAQHZZZFX",
                referenceId: serviceId.toString(),
                lineItems: [
                    {
                        name: "Total Service Cost",
                        quantity: "1",
                        basePriceMoney: {
                            amount: BigInt(amount * 100),
                            currency: "USD",
                        },
                    },
                ],
            },
            // order: {
            //   locationId: "L7CDHAQHZZZFX",
            //   id: order?.order?.id,
            // },
            // quickPay: {
            //   name: "Total Service Cost",
            //   priceMoney: {
            //     amount: BigInt(amount * 100),
            //     currency: "USD",
            //   },
            //   locationId: "L7CDHAQHZZZFX",
            // },
        });
        console.log({ session });
        const response = await client.orders.get({
            orderId: (_b = session === null || session === void 0 ? void 0 : session.paymentLink) === null || _b === void 0 ? void 0 : _b.orderId,
        });
        console.log({ response });
        const paymentUrl = ((_c = session.paymentLink) === null || _c === void 0 ? void 0 : _c.url) || "";
        const paymentQR = await qrcode_1.default.toDataURL(paymentUrl);
        res.json({ paymentQR });
    }
    catch (error) { }
};
exports.createSquareCheckoutsession = createSquareCheckoutsession;
