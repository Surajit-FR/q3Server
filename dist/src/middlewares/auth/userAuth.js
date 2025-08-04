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
exports.verifyUserType = exports.VerifyJWTToken = void 0;
const response_utils_1 = require("../../../utils/response.utils");
const asyncHandler_utils_1 = require("../../../utils/asyncHandler.utils");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../../models/user.model"));
// VerifyToken
exports.VerifyJWTToken = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        let token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken) || ((_b = req.header("Authorization")) === null || _b === void 0 ? void 0 : _b.replace("Bearer ", ""));
        if (!token) {
            console.log("Token is missing or empty");
            return (0, response_utils_1.handleResponse)(res, "error", 401, '', 'Unauthorized Request');
        }
        ;
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = yield user_model_1.default.findById(decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken._id).select("-password");
        if (!user) {
            return (0, response_utils_1.handleResponse)(res, "error", 401, '', 'Invalid access token');
        }
        ;
        req.user = user;
        next();
    }
    catch (error) {
        return (0, response_utils_1.handleResponse)(res, "error", 401, '', 'Invalid access token');
    }
}));
// verifyUserType
const verifyUserType = (requiredUserTypes = null) => {
    return (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.user) {
            return (0, response_utils_1.handleResponse)(res, "error", 401, '', 'Unauthorized Request');
        }
        if (requiredUserTypes && !requiredUserTypes.includes(req.user.userType)) {
            return (0, response_utils_1.handleResponse)(res, "error", 403, '', 'Access denied. Requires one of the following roles: ${requiredUserTypes.join(", ")}.`)');
        }
        next();
    }));
};
exports.verifyUserType = verifyUserType;
