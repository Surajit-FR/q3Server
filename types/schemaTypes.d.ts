import { Document, ObjectId } from "mongoose";



export interface IGeoJSONPoint {
    type: "Point";
    coordinates: [string, string]; // [longitude, latitude]
}
export interface IUser extends Document {
    _id: string | ObjectId;
    fullName: string;
    email: string;
    phone: string;
    password: string;
    dob: Date;
    avatar: string;
    isVerified: boolean;
    isOTPVerified: boolean;
    isEmailVerified: boolean;
    emailCode: string;
    isRegistered: boolean;
    userType: string;
    accessToken?: string;
    fcmToken?: string;
    stripeCustomerId?: string;
    paymentMethodId?: string;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    geoLocation: IGeoJSONPoint;

};

export interface IAdditionalUserInfo extends Document {
    _id: string | ObjectId;
    userId: ObjectId;
    driverLicense: string;
    driverLicenseImage: string;
    insuranceNumber: string;
    insuranceImage: string;
    isReadAggrement: boolean;
    isAnyArrivalFee?: boolean;
    arrivalFee: number;
    totalYearExperience: Number,
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface IOTPSchema extends Document {
    _id: ObjectId;
    userId: ObjectId;
    phoneNumber: string;
    otp: string;
    createdAt?: Date;
    expiredAt: Date;
    updatedAt?: Date;
    isVerified?: boolean;
};

export interface IEmailCodeSchema extends Document {
    _id: ObjectId;
    email: string;
    code: string;
    createdAt?: Date;
    updatedAt?: Date;
    isVerified?: boolean;
};

export interface IVehicleTypeSchema extends Document {
    _id: ObjectId;
    type: string;
    image: string;
    totalSeat?: string;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface ITowingServiceBookingSchema extends Document {
    _id: ObjectId;
    userId: ObjectId;
    pickupLocation: string;
    picklocation: IGeoJSONPoint;
    destinyLocation: string;
    totalDistance: string;
    vehicleTypeId: ObjectId;
    disputedVehicleImage: string;
    serviceSpecificNotes: string;
    isReqAccepted: boolean;
    serviceProviderId: ObjectId;
    serviceProgess: string;
    startedAt: Date;
    completedAt: Date;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};

interface ILocationSession extends Document {
    userId: mongoose.Types.ObjectId;
    location?: string;
    latitude?: string;
    longitude?: string;
    startedAt: Date;
    endedAt?: Date;
    duration?: number;
    isActive: boolean;
    serviceDetails: Array<IServiceDetailsSchema>
}

interface IServiceDetailsSchema extends Document {
    serviceId: mongoose.Types.ObjectId;
    serviceProgess: string;
    serviceDistance: number;
}

