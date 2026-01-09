import { Request, Response } from "express";
import Stripe from "stripe";
import UserModel from "../models/user.model";
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "../config/config";
import towingServiceBookingModel from "../models/towingServiceBooking.model";
const stripe = new Stripe(STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-09-30.acacia" as any,
});

export const stripeWebhook = async (req: Request, res: Response) => {
  console.log("webhook runs");

  const sig = req.headers["stripe-signature"] as string;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET!
    );
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
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

async function handleSuccess(session: any) {
  const serviceId = session.metadata.serviceId;
  const customerId = session.customer;

  console.log("Payment Successful for session:", session.id);

  await towingServiceBookingModel.findByIdAndUpdate(serviceId, {
    isPaymentComplete: true,
    paymentIntentId: session.payment_intent,
    serviceProgess:"ServiceCompleted"
  });
}


async function handleFailure(paymentIntent: any) {
  const serviceId = paymentIntent.metadata?.serviceId;

  console.log(" Payment Failed for Intent:", paymentIntent.id);

  if (serviceId) {
    await towingServiceBookingModel.findByIdAndUpdate(serviceId, {
      isPaymentComplete: false,
    });
  }
}
