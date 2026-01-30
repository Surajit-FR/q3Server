"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = void 0;
const response_utils_1 = require("./response.utils");
const user_model_1 = __importDefault(require("../src/models/user.model"));
const generateAccessToken = async (res, userId) => {
    try {
        const user = await user_model_1.default.findById(userId);
        console.log("user", user);
        const accessToken = user === null || user === void 0 ? void 0 : user.generateAccessToken();
        if (!user) {
            throw (0, response_utils_1.handleResponse)(res, 'error', 400, "", "User Not Found");
        }
        user.accessToken = accessToken;
        await (user === null || user === void 0 ? void 0 : user.save({ validateBeforeSave: false }));
        return { accessToken };
    }
    catch (err) {
        throw (0, response_utils_1.handleResponse)(res, 'error', 500, "", "Something went wrong while generating refresh and access token");
    }
    ;
};
exports.generateAccessToken = generateAccessToken;
