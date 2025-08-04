"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const towingServiceBooking_controller_1 = require("../controller/towingServiceBooking.controller");
const userAuth_1 = require("../middlewares/auth/userAuth");
const router = express_1.default.Router();
router.use(userAuth_1.VerifyJWTToken);
router.route('/book-towing-service').post(towingServiceBooking_controller_1.bookTowingService);
// router.route('/enable-location').post(enableLocation);
router.route('/fetch-nearby-service-request').get(towingServiceBooking_controller_1.fetchTowingServiceRequest);
//for sp 
router.route('/accept-service-request').post((0, userAuth_1.verifyUserType)(["ServiceProvider"]), towingServiceBooking_controller_1.acceptServiceRequest);
exports.default = router;
