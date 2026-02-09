"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchQueryMessage = exports.sendQueryMessage = void 0;
const asyncHandler_utils_1 = require("../../utils/asyncHandler.utils");
const response_utils_1 = require("../../utils/response.utils");
const sendEmail_1 = require("../../utils/sendEmail");
const contact_model_1 = __importDefault(require("../models/contact.model"));
exports.sendQueryMessage = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    console.log("Api runs...: sendQueryMessage");
    const { fullName, email, issueType, issueMsg } = req.body;
    console.log(req.body, "sendQueryMessage");
    if (!fullName || !email || !issueType || !issueMsg) {
        return (0, response_utils_1.handleResponse)(res, "error", 400, {}, "Fullname email,issue type and message all are required field");
    }
    const from = email;
    const html = `
    <p><strong>Full Name:</strong> ${fullName}</p>
    <p><strong>Email:</strong> ${email}</p>   
    <p><strong>Message:</strong></p>
<p style="margin-left: 20px; font-style: italic;">${issueMsg}</p>`;
    const sendMailToAdminEmail = await (0, sendEmail_1.sendMailToAdmin)(from, fullName, html);
    if (sendMailToAdminEmail) {
        const to = email;
        const subject = "Thank You";
        const html = `Dear ${fullName}, thank you for contacting us`;
        await (0, sendEmail_1.sendMail)(to, subject, html);
        const contactUsData = await contact_model_1.default.create({
            fullName,
            email,
            issueType,
            issueMsg,
        });
        if (!contactUsData) {
            return (0, response_utils_1.handleResponse)(res, "error", 500, {}, "Failed to send your message.");
        }
        return (0, response_utils_1.handleResponse)(res, "success", 200, contactUsData, "Message sent successfully.");
    }
});
exports.fetchQueryMessage = (0, asyncHandler_utils_1.asyncHandler)(async (req, res) => {
    console.log("Api runs...: fetchQueryMessage");
    const queryMessages = await contact_model_1.default.aggregate([
        {
            $match: {
                isDeleted: false,
            },
        },
        {
            $project: {
                _id: 1,
                fullName: 1,
                email: 1,
                issueType: 1,
                issueMsg: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
    ]);
    if (!queryMessages.length) {
        return (0, response_utils_1.handleResponse)(res, "success", 200, queryMessages, "No messages till now.");
    }
    return (0, response_utils_1.handleResponse)(res, "success", 200, queryMessages, "Queries fetched successfully.");
});
