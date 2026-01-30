import { Document, ObjectId } from "mongoose";

export interface IGeoJSONPoint {
  type: "Point";
  coordinates: [string, string]; // [longitude, latitude]
}
export interface IUser extends Document {
  _id: string | ObjectId;
  fullName: string;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
  dob: Date;
  avatar: string;
  vehicleRegistrationNumber: string;
  isVerified: boolean;
  isOTPVerified: boolean;
  isEmailVerified: boolean;
  emailCode: string;
  isRegistered: boolean;
  stripeAccountId: string;
  stripeOnboarded: boolean;
  userType: string;
  accessToken?: string;
  fcmToken?: string;
  stripeCustomerId?: string;
  paymentMethodId?: string;
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  isDeleted?: boolean;
  isBan?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  geoLocation: IGeoJSONPoint;
}

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
  totalYearExperience: Number;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOTPSchema extends Document {
  _id: ObjectId;
  userId: ObjectId;
  phoneNumber: string;
  otp: string;
  createdAt?: Date;
  expiredAt: Date;
  updatedAt?: Date;
  isVerified?: boolean;
}

export interface IEmailCodeSchema extends Document {
  _id: ObjectId;
  email: string;
  code: string;
  createdAt?: Date;
  updatedAt?: Date;
  isVerified?: boolean;
}

export interface IVehicleTypeSchema extends Document {
  _id: ObjectId;
  type: string;
  image: string;
  totalSeat?: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface IProviderVehicleDetails extends Document {
  _id: ObjectId;
  type: string;
  number: string;
  modelName: string;
  driverName: string;
  driverImage: string;
  driverNumber: string;
}

export interface ITowingServiceBookingSchema extends Document {
  _id: ObjectId;
  userId: ObjectId;
  isCurrentLocationforPick: boolean;
  pickupLocation: string;
  picklocation: IGeoJSONPoint;
  placeId_pickup: string;
  placeId_destination: string;
  destinyLocation: string;
  totalDistance: string;
  vehicleTypeId: ObjectId;
  disputedVehicleImage: string;
  serviceSpecificNotes: string;
  providerVehicleDetails: IProviderVehicleDetails; //providerVehicleDetails
  isReqAccepted: boolean;
  serviceProviderId: ObjectId;
  serviceProgess: string;
  startedAt: Date;
  completedAt: Date;
  declinedBy: Array<String>;
  isCustomPricing: boolean;
  pricing: object;
  isPaymentComplete: boolean;
  paymentIntentId: string;
  serviceCode: number;
  isServiceCodeVerified: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ILocationSession extends Document {
  userId: mongoose.Types.ObjectId;
  location?: string;
  latitude?: string;
  longitude?: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  isActive: boolean;
  serviceDetails: Array<IServiceDetailsSchema>;
}

interface IServiceDetailsSchema extends Document {
  serviceId: mongoose.Types.ObjectId;
  serviceProgess: string;
  serviceDistance: number;
}

export interface IRatingSchema extends Document {
  _id: ObjectId;
  ratedBy: ObjectId;
  ratedTo: ObjectId;
  serviceId: ObjectId;
  rating: number;
  comments: string;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChatSchema {
  fromUserId: ObjectId;
  toUserId: ObjectId;
  content: string;
  isRead?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChatListSchema {
  userId: ObjectId;
  chatWithUserId: ObjectId;
  lastMessage: string;
  lastMessageAt: Date;
  isRead?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ICanceledServiceBySP extends Document {
  costumerId: mongoose.Types.ObjectId;
  spId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  progressBeforeCancel: string;
  reason: string;
  createdAt?: Date;
  updatedAt?: Date;
}
interface IServicePricingRule extends Document {
  baseFee: number;
  includedMiles: number;
  costPerMile: number;
  additionalFee: number;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
interface IServiceCustomPricingRule extends Document {
  appliesToVehicleType: string;
  instructions: string;
  contactNumber: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
interface ILocationPointSchema extends Document {
  lat: number;
  lng: number;
  timestamp: Date;
}
interface ISPLocationTrackingSchema extends Document {
  spId: ObjectId;
  serviceId: ObjectId;
  lastLocations: ILocationPointSchema[];
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRatingSchema extends Document {
    _id: ObjectId;
    ratedBy: ObjectId;
    ratedTo: ObjectId;
    rating: number;
    comments: string;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};
