import mongoose, { Schema, Model } from "mongoose";
import { IAdditionalUserInfo } from "../../types/schemaTypes";

// Additional Info Schema
const AdditionalUserInfoSchema: Schema<IAdditionalUserInfo> = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, require: true },
    driverLicense: { type: String, default: "", },
    driverLicenseImage: { type: String, default: "", },
    insuranceNumber: { type: String, default: "", },
    insuranceImage: { type: String, default: "", },
    isReadAggrement: { type: Boolean, default: false },
    isAnyArrivalFee: { type: Boolean, default: false },
    arrivalFee: { type: Number },
    totalYearExperience: { type: Number, require: [true, "Total Year of Experience is Required."] },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const AdditionalInfoModel: Model<IAdditionalUserInfo> = mongoose.model<IAdditionalUserInfo>("additionalInfo", AdditionalUserInfoSchema);
export default AdditionalInfoModel;