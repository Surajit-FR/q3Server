import { Response, Request } from "express";
import { CustomRequest } from "../../types/commonType";
import { asyncHandler } from "../../utils/asyncHandler.utils";
import { handleResponse } from "../../utils/response.utils";
import { sendMail, sendMailToAdmin } from "../../utils/sendEmail";
import ContactUsModel from "../models/contact.model";

export const sendQueryMessage = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { fullName, email, issueType, issueMsg } = req.body;

    console.log(req.body, "sendQueryMessage");

    if (!fullName || !email || !issueType || !issueMsg) {
      return handleResponse(
        res,
        "error",
        400,
        {},
        "Fullname email,issue type and message all are required field",
      );
    }

    const from = email;
    const html = `
    <p><strong>Full Name:</strong> ${fullName}</p>
    <p><strong>Email:</strong> ${email}</p>   
    <p><strong>Message:</strong></p>
<p style="margin-left: 20px; font-style: italic;">${issueMsg}</p>`;

    const sendMailToAdminEmail = await sendMailToAdmin(from, fullName, html);
    if (sendMailToAdminEmail) {
      const to = email;
      const subject = "Thank You";
      const html = `Dear ${fullName}, thank you for contacting us`;
      await sendMail(to, subject, html);

      const contactUsData = await ContactUsModel.create({
        fullName,
        email,
        issueType,
        issueMsg,
      });

      if (!contactUsData) {
        return handleResponse(
          res,
          "error",
          500,
          {},
          "Failed to send your message.",
        );
      }
      return handleResponse(
        res,
        "success",
        200,
        contactUsData,
        "Message sent successfully.",
      );
    }
  },
);

export const fetchQueryMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const queryMessages = await ContactUsModel.aggregate([
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
        },
      },
    ]);
    if (!queryMessages.length) {
      return handleResponse(
        res,
        "success",
        200,
        queryMessages,
        "No messages till now.",
      );
    }

    return handleResponse(
      res,
      "success",
      200,
      queryMessages,
      "Queries fetched successfully.",
    );
  },
);
