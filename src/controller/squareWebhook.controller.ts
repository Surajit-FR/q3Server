import express, { Response } from "express";
import { WebhooksHelper } from "square"; // Use 'square' for the new SDK
import {
  SQUARE_SIGNATURE_KEY,
  SQUARE_NOTIFICATION_URL,
} from "../config/config"; // Replace with the key from Step 2

const app = express();
app.use(express.raw({ type: "application/json" }));

export const squareWebhook = async (req: any, res: Response) => {
  console.log("webhook runs");
  try {
    const signature = req.headers["x-square-hmacsha256-signature"];
    const rawBody: string = req.body; // The raw body as a Buffer

    // Verify the signature
    const isVerified = await WebhooksHelper.verifySignature({
      requestBody: rawBody,
      signatureHeader: signature,
      signatureKey: SQUARE_SIGNATURE_KEY,
      notificationUrl: SQUARE_NOTIFICATION_URL,
    });

    if (isVerified) {
      // Process the event
      const event = JSON.parse(rawBody.toString());
      console.log("Received verified webhook event:", event.event_type);
      if (event.type === "payment.updated") {
        const payment = event.data.object.payment;

        if (payment.status === "COMPLETED") {
          console.log("payment", payment);

          // ✅ PAYMENT SUCCESS
          // 1. Verify amount & currency
          // 2. Match referenceId / orderId
          // 3. Mark service as PAID
        }
      }

      res.json({ status: 200, msg: "Event received and verified" });
    } else {
      console.error("Webhook signature verification failed.");
      res.status(403).send("Verification failed");
    }
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};
