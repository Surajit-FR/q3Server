import mongoose, { Schema, Model } from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser } from "../../types/schemaTypes";




const UserSchema: Schema<IUser> = new Schema({
    fullName: {
        type: String,
        required: false,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        // unique: true,
        lowercase: true,
        default: ""
    },
    phone: {
        type: String,
        default: "",
        required: false,
        // unique:true
    },
    dob: {
        type: Date,
        default: null
    },
    password: {
        type: String,
        // required: [true, "Password is required"],
    },
    emailCode: {
        type: String,
    },
    avatar: {
        type: String,
        default: "",
        required: false,
    },
    userType: {
        type: String,
        enum: ["SuperAdmin", "ServiceProvider", "Customer", "FieldAgent", "TeamLead", "Admin", "Finance"],
        default: ""
    }, 
    isRegistered: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isOTPVerified: {
        type: Boolean,
        default: false
    },
    stripeCustomerId: {
        type: String,
        default: ""
    },
    paymentMethodId: {
        type: String,
    },
    accessToken: {
        type: String,
        default: "",
    },
    fcmToken: {
        type: String,
        default: "",
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    geoLocation: {
        type: {
            type: String,
            enum: ["Point"],
        },
        coordinates: {
            type: [Number],
        },
    },
}, { timestamps: true });

//pre - save hook for hashing password
UserSchema.pre("save", async function (next) {
    console.log("hashed done");
    if (!this.isModified("password")) return next();
    try {
        this.password = await bcrypt.hash(this.password, 10);
        console.log(this.password, "hashed password during sign up");
        next();
    } catch (err: any) {
        next(err)
    }
});

//check password
UserSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
    console.log("isPasswordCorrect checked", password);
    console.log(this.password);
    console.log(await bcrypt.compare(password, this.password));
    return await bcrypt.compare(password, this.password)
}

//generate acces token
UserSchema.methods.generateAccessToken = function (): string {

    return jwt.sign({
        _id: this._id,
        userType: this.userType,
    }, process.env.ACCESS_TOKEN_SECRET as string,
        { expiresIn: 31536000 })
};

UserSchema.methods.generateRefreshToken = function (): string {
    return jwt.sign({
        _id: this._id
    }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: 864000 })
};


const UserModel: Model<IUser> = mongoose.model<IUser>("user", UserSchema);
export default UserModel;