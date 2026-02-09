"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSPPayout = exports.payoutServiceProvider = exports.createCheckoutsession = void 0;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = require("../config/config");
const user_model_1 = __importDefault(require("../models/user.model"));
const qrcode_1 = __importDefault(require("qrcode"));
const payout_model_1 = __importDefault(require("../models/payout.model"));
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const response_utils_1 = require("../../utils/response.utils");
const mongoose_1 = __importDefault(require("mongoose"));
const stripe = new stripe_1.default(config_1.STRIPE_SECRET_KEY, {
    apiVersion: "2024-09-30.acacia",
});
//session for towing service payment payment
const createCheckoutsession = async (req, res) => {
    var _a;
    try {
        console.log("Api runs...: createCheckoutsession");
        const { amount, serviceId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const currency = "usd";
        const user = await user_model_1.default.findById(userId);
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: `${user.fullName}`,
            });
            stripeCustomerId = customer.id;
            await user_model_1.default.findByIdAndUpdate(userId, { stripeCustomerId });
        }
        const session = await stripe.checkout.sessions.create({
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
        const paymentQR = await qrcode_1.default.toDataURL(paymentUrl);
        // await towingServiceBookingModel.findByIdAndUpdate(serviceId, {
        //   isPaymentComplete: true,
        //   paymentIntentId: session.payment_intent,
        //   serviceProgess:"ServiceCompleted"
        // });
        res.json({ paymentQR });
    }
    catch (error) { }
};
exports.createCheckoutsession = createCheckoutsession;
const payoutServiceProvider = async (req, res) => {
    var _a;
    console.log("Api runs...: payoutServiceProvider");
    const { spId, first_name, last_name, amount, serviceId, socialSecurity, dob, accountNumber, ifsc, routing_number, } = req.body;
    if (!spId || !amount) {
        res.status(400).json({
            success: false,
            message: "spId and amount are required",
        });
    }
    const sp = await user_model_1.default.findById(spId);
    if (!sp) {
        res.status(404).json({
            success: false,
            message: "Service Provider not found",
        });
    }
    /**
     * 🔹 FIRST TIME → CREATE STRIPE ACCOUNT
     */
    if (!(sp === null || sp === void 0 ? void 0 : sp.stripeAccountId)) {
        const account = await stripe.accounts.create({
            type: "custom",
            country: "US",
            email: sp === null || sp === void 0 ? void 0 : sp.email,
            business_type: "individual",
            capabilities: {
                transfers: { requested: true },
            },
            individual: {
                first_name: first_name,
                last_name: last_name,
                email: sp === null || sp === void 0 ? void 0 : sp.email,
                phone: sp === null || sp === void 0 ? void 0 : sp.phone,
                ssn_last_4: socialSecurity,
                dob: {
                    day: dob.day,
                    month: dob.month,
                    year: dob.year,
                },
            },
            business_profile: {
                url: "https://your-test-business.com",
                mcc: "5818",
            },
            tos_acceptance: {
                date: Math.floor(Date.now() / 1000),
                ip: req.ip || "127.0.0.1",
            },
        });
        await stripe.accounts.createExternalAccount(account.id, {
            external_account: {
                object: "bank_account",
                country: "US",
                currency: "usd",
                account_number: accountNumber,
                routing_number: routing_number,
            },
        });
        if (sp) {
            sp.stripeAccountId = account.id;
            sp.stripeOnboarded = false;
            await sp.save();
        }
    }
    if (sp) {
        // 🔹 CREATE ONBOARDING URL
        const accountLink = await stripe.accountLinks.create({
            account: sp === null || sp === void 0 ? void 0 : sp.stripeAccountId,
            refresh_url: "https://yourdomain.com/stripe/onboarding/refresh",
            return_url: "https://yourdomain.com/stripe/onboarding/success",
            type: "account_onboarding",
        });
        // 🔹 CHECK CAPABILITY
        const accountDetails = await stripe.accounts.retrieve(sp.stripeAccountId);
        // If transfers not active, send onboarding URL
        if (((_a = accountDetails.capabilities) === null || _a === void 0 ? void 0 : _a.transfers) !== "active") {
            res.status(200).json({
                success: true,
                message: "Please complete Stripe onboarding",
                onboardingUrl: accountLink.url,
                accountId: sp.stripeAccountId,
                capabilities: accountDetails.capabilities,
            });
        }
    }
    // 1️⃣ Transfer Admin → SP
    const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        destination: sp ? sp.stripeAccountId : "",
        metadata: {
            spId,
            serviceId,
        },
    });
    // 2️⃣ Payout SP → Bank
    const payout = await stripe.payouts.create({
        amount: Math.round(amount * 100),
        currency: "usd",
    }, {
        stripeAccount: sp ? sp.stripeAccountId : "",
    });
    // // 3️⃣ Update wallet
    // sp.walletBalance = Math.max(0, sp.walletBalance - amount);
    // await sp.save();
    if (payout) {
        // After successful payout
        await payout_model_1.default.create({
            serviceProviderId: sp === null || sp === void 0 ? void 0 : sp._id,
            serviceId,
            amount,
            stripeAccountId: sp === null || sp === void 0 ? void 0 : sp.stripeAccountId,
            transferId: transfer.id,
            payoutId: payout.id,
            status: "paid",
            metadata: {
                bankLast4: payout.destination,
                payoutArrivalDate: payout.arrival_date,
            },
        });
    }
    res.status(200).json({
        success: true,
        message: "Payout completed successfully",
        transferId: transfer.id,
        payoutId: payout.id,
    });
};
exports.payoutServiceProvider = payoutServiceProvider;
exports.fetchSPPayout = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    console.log("Api runs...: fetchSPPayout");
    const { serviceProviderId } = req.body;
    if (!serviceProviderId) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, "", "Service Provider ID is required");
    }
    const payouts = await payout_model_1.default.aggregate([
        {
            $match: {
                serviceProviderId: new mongoose_1.default.Types.ObjectId(serviceProviderId),
                status: "paid",
            },
        },
        {
            $project: {
                serviceId: 0,
            },
        },
    ]);
    return (0, response_utils_1.handleResponse)(res, "success", 200, payouts, "Payouts fetched successfully");
});
