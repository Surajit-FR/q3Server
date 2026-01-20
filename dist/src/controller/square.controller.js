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
const createSquareCheckoutsession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { amount, serviceId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const user = yield user_model_1.default.findById(userId);
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        const order = yield client.orders.create({
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
        });
        const session = yield client.checkout.paymentLinks.create({
            idempotencyKey: crypto.randomUUID(),
            quickPay: {
                name: "Total Service Cost",
                priceMoney: {
                    amount: BigInt(amount * 100),
                    currency: "USD",
                },
                locationId: "L7CDHAQHZZZFX",
            },
        });
        const paymentUrl = ((_b = session.paymentLink) === null || _b === void 0 ? void 0 : _b.url) || "";
        const paymentQR = yield qrcode_1.default.toDataURL(paymentUrl);
        res.json({ paymentQR });
    }
    catch (error) { }
});
exports.createSquareCheckoutsession = createSquareCheckoutsession;
