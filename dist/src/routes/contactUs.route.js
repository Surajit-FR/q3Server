"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userAuth_1 = require("../middlewares/auth/userAuth");
const contactUs_controller_1 = require("../controller/contactUs.controller");
const router = express_1.default.Router();
router.use(userAuth_1.VerifyJWTToken);
router.route("/send-query").post(contactUs_controller_1.sendQueryMessage);
router.route("/fetch-queries").get(contactUs_controller_1.fetchQueryMessage);
exports.default = router;
