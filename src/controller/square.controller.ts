import { SquareClient, SquareEnvironment } from "square";
import { getLocations } from "../config/square";
import QRCode from "qrcode";
import { CustomRequest } from "../../types/commonType";
import UserModel from "../models/user.model";
import { SQUARE_ACCESS_TOKEN } from "../config/config";
const client = new SquareClient({
  environment: SquareEnvironment.Sandbox,
  token: SQUARE_ACCESS_TOKEN,
});

//session for towing service payment payment
export const createSquareCheckoutsession = async (
  req: CustomRequest,
  res: any,
) => {
  try {
    const { amount, serviceId } = req.body;
    const userId = req.user?._id;

    const user = await UserModel.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const order = await client.orders.create({
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

    const session = await client.checkout.paymentLinks.create({
      idempotencyKey: crypto.randomUUID(),
      // quickPay: {
      //   name: "Total Service Cost",
      //   priceMoney: {
      //     amount: BigInt(amount * 100),
      //     currency: "USD",
      //   },
      //   locationId: "L7CDHAQHZZZFX",
      // },
      order:{
         locationId: "L7CDHAQHZZZFX",
         id:order?.order?.id
      }
    });
    console.log({session});
    
    const paymentUrl = session.paymentLink?.url || "";
    const paymentQR = await QRCode.toDataURL(paymentUrl);
    res.json({ paymentQR });
  } catch (error) {}
};
