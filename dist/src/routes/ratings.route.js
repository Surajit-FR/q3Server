"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userAuth_1 = require("../middlewares/auth/userAuth");
const rating_controller_1 = require("../controller/rating.controller");
const router = express_1.default.Router();
router.use(userAuth_1.VerifyJWTToken);
router.route("/give-rating").post(rating_controller_1.addRating);
exports.default = router;
