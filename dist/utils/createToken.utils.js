"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = void 0;
const response_utils_1 = require("./response.utils");
const user_model_1 = __importDefault(require("../src/models/user.model"));
const generateAccessToken = (res, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findById(userId);
        console.log("user", user);
        const accessToken = user === null || user === void 0 ? void 0 : user.generateAccessToken();
        if (!user) {
            throw (0, response_utils_1.handleResponse)(res, 'error', 400, "", "User Not Found");
        }
        user.accessToken = accessToken;
        yield (user === null || user === void 0 ? void 0 : user.save({ validateBeforeSave: false }));
        return { accessToken };
    }
    catch (err) {
        throw (0, response_utils_1.handleResponse)(res, 'error', 500, "", "Something went wrong while generating refresh and access token");
    }
    ;
});
exports.generateAccessToken = generateAccessToken;
