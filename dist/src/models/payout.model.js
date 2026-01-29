"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const payoutSchema = new mongoose_1.Schema({
    serviceProviderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "ServiceProvider",
        required: true,
    },
    serviceId: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: "usd",
    },
    stripeAccountId: {
        type: String,
        required: true,
    },
    transferId: {
        type: String,
        required: true,
    },
    payoutId: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "paid",
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Payout", payoutSchema);
