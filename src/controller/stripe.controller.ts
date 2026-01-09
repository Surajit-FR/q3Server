import { Response } from "express";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../config/config";
import { CustomRequest } from "../../types/commonType";
import UserModel from "../models/user.model";
import QRCode from "qrcode";
import towingServiceBookingModel from "../models/towingServiceBooking.model";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-09-30.acacia" as any,
});

//session for towing service payment payment
export const createCheckoutsession = async (req: CustomRequest, res: any) => {
  try {
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
