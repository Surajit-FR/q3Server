import mongoose, { Schema, Model } from "mongoose";
import { IContactUsSchema } from "../../types/schemaTypes";

const ContactUsSchema: Schema<IContactUsSchema> = new Schema(
  {
    fullName: {
      type: String,
    },
    email: {
      type: String,
    },
    issueType: {
      type: String,
    },
    issueMsg: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const ContactUsModel: Model<IContactUsSchema> =
  mongoose.model<IContactUsSchema>("ContactUs", ContactUsSchema);
export default ContactUsModel;
