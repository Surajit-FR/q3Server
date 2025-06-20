import mongoose, { Schema, Model } from "mongoose";
import { IVehicleTypeSchema } from "../../types/schemaTypes";

const vehicleTypeSchema: Schema<IVehicleTypeSchema> = new Schema({

    type: {
        type: String,
    },
    image: {
        type: String,
    },
    totalSeat: {
        type: String,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

const vehicleTypeModel: Model<IVehicleTypeSchema> = mongoose.model<IVehicleTypeSchema>('vehicleType', vehicleTypeSchema);
export default vehicleTypeModel;