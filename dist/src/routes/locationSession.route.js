"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const locationSession_controller_1 = require("../controller/locationSession.controller");
const userAuth_1 = require("../middlewares/auth/userAuth");
const router = express_1.default.Router();
router.use(userAuth_1.VerifyJWTToken);
router.route('/enable-location').post(locationSession_controller_1.enableLocation);
router.route('/disable-location').get(locationSession_controller_1.disableLocation);
router.route('/get-total-online_duration').get(locationSession_controller_1.getTotalOnlineTime);
exports.default = router;
