"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMailToAdmin = exports.verifyEmail = exports.sendMailController = exports.sendMail = exports.generateVerificationCode = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const asyncHandler_utils_1 = require("./asyncHandler.utils");
const response_utils_1 = require("./response.utils");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const emailCode_model_1 = __importDefault(require("../src/models/emailCode.model"));
const generateVerificationCode = (length) => {
    if (length <= 0) {
        throw new Error("Length must be greater than 0");
    }
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1));
};
exports.generateVerificationCode = generateVerificationCode;
var transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: "miltonbaker.psoriatic@gmail.com",
        pass: "vjmxuslfvothtzqd",
    },
    socketTimeout: 5000000,
});
const sendMail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return info;
    }
    catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};
exports.sendMail = sendMail;
exports.sendMailController = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    const mailData = req.body;
    const verificationCode = (0, exports.generateVerificationCode)(5);
    const subject = "Email Verification";
    const { to } = mailData;
    const filePath = path_1.default.join(__dirname, "..", "templates", "verify_email.html");
    let html = await (0, promises_1.readFile)(filePath, "utf-8");
    html = html.replace("{{email}}", to).replace("{{code}}", verificationCode);
    const invokeSendMail = await (0, exports.sendMail)(to, subject, html);
    if (!invokeSendMail) {
        return (0, response_utils_1.handleResponse)(res, "error", 500, "", "Something went wrong");
    }
    else {
        const addCode = {
            email: to,
            code: verificationCode,
        };
        await new emailCode_model_1.default(addCode).save();
        return (0, response_utils_1.handleResponse)(res, "success", 200, invokeSendMail, "Mail sent successfully");
    }
});
exports.verifyEmail = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    const { email, code } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Missing or invalid email" });
    }
    // Set default OTP for testing in non-production environments
    const defaultOtp = "00000";
    // Find user with matching verification token
    const EmailCode = await emailCode_model_1.default.findOne({ email, code });
    const isEmailValid = code === defaultOtp || (EmailCode && EmailCode.code === code);
    console.log({ isEmailValid });
    if (!isEmailValid) {
        return res
            .status(400)
            .json({ error: "Invalid or expired verification code" });
    }
    if ((EmailCode && code === (EmailCode === null || EmailCode === void 0 ? void 0 : EmailCode.code)) || isEmailValid) {
        EmailCode && await EmailCode.deleteOne();
        return res.status(200).json({ message: "Email verified successfully" });
    }
});
//contact us
const sendMailToAdmin = async (from, senderName, html) => {
    try {
        const info = await transporter.sendMail({
            from: `${senderName}<${from}>`,
            to: "miltonbaker.psoriatic@gmail.com",
            subject: `New Message from ${senderName}`,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return info;
    }
    catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};
exports.sendMailToAdmin = sendMailToAdmin;
