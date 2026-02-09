import { Response, Request } from "express";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../config/config";
import { CustomRequest } from "../../types/commonType";
import UserModel from "../models/user.model";
import QRCode from "qrcode";
import towingServiceBookingModel from "../models/towingServiceBooking.model";
import { getLocations } from "../config/square";
import { userInfo } from "node:os";
import payoutModel from "../models/payout.model";
import { asyncHandler } from "../../utils/asyncHandler.utils";
import { handleResponse } from "../../utils/response.utils";
import mongoose from "mongoose";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-09-30.acacia" as any,
});

//session for towing service payment payment
export const createCheckoutsession = async (req: CustomRequest, res: any) => {
  try {
    console.log("Api runs...: createCheckoutsession");

    const { amount, serviceId } = req.body;
    const userId = req.user?._id;
    const currency = "usd";

    const user = await UserModel.findById(userId);
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
      await UserModel.findByIdAndUpdate(userId, { stripeCustomerId });
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
        description: `Towing service fee_paid_by_customer_${userId?.toString()}_for_service_${serviceId}`,
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
    } as Stripe.Checkout.SessionCreateParams);
    console.log({ Incentivesession: session });

    const paymentUrl = session.url || "";

    const paymentQR = await QRCode.toDataURL(paymentUrl);

    // await towingServiceBookingModel.findByIdAndUpdate(serviceId, {
    //   isPaymentComplete: true,
    //   paymentIntentId: session.payment_intent,
    //   serviceProgess:"ServiceCompleted"
    // });

    res.json({ paymentQR });
  } catch (error) {}
};

export const payoutServiceProvider = async (
  req: CustomRequest,
  res: Response,
) => {
  console.log("Api runs...: payoutServiceProvider");

  const {
    spId,
    first_name,
    last_name,
    amount,
    serviceId,
    socialSecurity,
    dob,
    accountNumber,
    ifsc,
    routing_number,
  } = req.body;

  if (!spId || !amount) {
    res.status(400).json({
      success: false,
      message: "spId and amount are required",
    });
  }

  const sp = await UserModel.findById(spId);

  if (!sp) {
    res.status(404).json({
      success: false,
      message: "Service Provider not found",
    });
  }
  /**
   * 🔹 FIRST TIME → CREATE STRIPE ACCOUNT
   */
  if (!sp?.stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "custom",
      country: "US",
      email: sp?.email,
      business_type: "individual",
      capabilities: {
        transfers: { requested: true },
      },
      individual: {
        first_name: first_name,
        last_name: last_name,
        email: sp?.email,
        phone: sp?.phone,
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
      account: sp?.stripeAccountId,
      refresh_url: "https://yourdomain.com/stripe/onboarding/refresh",
      return_url: "https://yourdomain.com/stripe/onboarding/success",
      type: "account_onboarding",
    });

    // 🔹 CHECK CAPABILITY
    const accountDetails = await stripe.accounts.retrieve(sp.stripeAccountId);

    // If transfers not active, send onboarding URL
    if (accountDetails.capabilities?.transfers !== "active") {
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
  const payout = await stripe.payouts.create(
    {
      amount: Math.round(amount * 100),
      currency: "usd",
    },
    {
      stripeAccount: sp ? sp.stripeAccountId : "",
    },
  );

  // // 3️⃣ Update wallet
  // sp.walletBalance = Math.max(0, sp.walletBalance - amount);
  // await sp.save();
  if (payout) {
    // After successful payout
    await payoutModel.create({
      serviceProviderId: sp?._id,
      serviceId,
      amount,
      stripeAccountId: sp?.stripeAccountId,
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

export const fetchSPPayout = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    console.log("Api runs...: fetchSPPayout");

    const { serviceProviderId } = req.body;
    if (!serviceProviderId) {
      return handleResponse(
        res,
        "error",
        400,
        "",
        "Service Provider ID is required",
      );
    }
    const payouts = await payoutModel.aggregate([
      {
        $match: {
          serviceProviderId: new mongoose.Types.ObjectId(serviceProviderId),
          status: "paid",
        },
      },
      {
        $project: {
          serviceId: 0,
        },
      },
    ]);
    return handleResponse(
      res,
      "success",
      200,
      payouts,
      "Payouts fetched successfully",
    );
  },
);
