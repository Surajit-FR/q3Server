"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserSchema = new mongoose_1.Schema({
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
        default: "",
    },
    countryCode: {
        type: String,
    },
    phone: {
        type: String,
        default: "",
        required: false,
        // unique:true
    },
    dob: {
        type: Date,
        default: null,
    },
    password: {
        type: String,
        // required: [true, "Password is required"],
    },
    emailCode: {
        type: String,
    },
    stripeAccountId: {
        type: String,
    },
    stripeOnboarded: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: "",
        required: false,
    },
    vehicleRegistrationNumber: {
        type: String,
        default: null,
    },
    userType: {
        type: String,
        enum: [
            "SuperAdmin",
            "ServiceProvider",
            "Customer",
            "FieldAgent",
            "TeamLead",
            "Admin",
            "Finance",
        ],
        default: "",
    },
    isRegistered: {
        type: Boolean,
        default: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isOTPVerified: {
        type: Boolean,
        default: false,
    },
    stripeCustomerId: {
        type: String,
        default: "",
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
    isBan: {
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
    if (!this.isModified("password"))
        return next();
    try {
        this.password = await bcrypt_1.default.hash(this.password, 10);
        console.log(this.password, "hashed password during sign up");
        next();
    }
    catch (err) {
        next(err);
    }
});
//check password
UserSchema.methods.isPasswordCorrect = async function (password) {
    console.log("isPasswordCorrect checked", password);
    console.log(this.password);
    console.log(await bcrypt_1.default.compare(password, this.password));
    return await bcrypt_1.default.compare(password, this.password);
};
//generate acces token
UserSchema.methods.generateAccessToken = function () {
    return jsonwebtoken_1.default.sign({
        _id: this._id,
        userType: this.userType,
    }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 31536000 });
};
UserSchema.methods.generateRefreshToken = function () {
    return jsonwebtoken_1.default.sign({
        _id: this._id,
    }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: 864000 });
};
const UserModel = mongoose_1.default.model("user", UserSchema);
exports.default = UserModel;
