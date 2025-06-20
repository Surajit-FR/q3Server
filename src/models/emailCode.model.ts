import mongoose, { Schema, Model } from "mongoose";
import { IEmailCodeSchema } from "../../types/schemaTypes";

const emialCodeSchema: Schema<IEmailCodeSchema> = new Schema({

    email: {
        type: String,
    },
    code: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: 120 }
    },

}, { timestamps: true });

const EmailCodeModel: Model<IEmailCodeSchema> = mongoose.model<IEmailCodeSchema>('email_code', emialCodeSchema);
export default EmailCodeModel;
