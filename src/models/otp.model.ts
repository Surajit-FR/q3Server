import mongoose, { Schema, Model } from "mongoose";
import { IOTPSchema } from "../../types/schemaTypes";

const otpSchema: Schema<IOTPSchema> = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    phoneNumber: {
        type: String,
    },
    otp: {
        type: String,
        unique: true,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // index: { expires: 90 }
    },

}, { timestamps: true });

const OTPModel: Model<IOTPSchema> = mongoose.model<IOTPSchema>('otp', otpSchema);
export default OTPModel;
