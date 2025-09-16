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
router.route("/book-towing-service").post(towingServiceBooking_controller_1.bookTowingService);
router.route("/booking-preview").post(towingServiceBooking_controller_1.previewTowingService);
router.route("/fetch-nearby-service-request").get(towingServiceBooking_controller_1.fetchTowingServiceRequest);
router
    .route("/decline-service-request")
    .post((0, userAuth_1.verifyUserType)(["ServiceProvider"]), towingServiceBooking_controller_1.declineServicerequest);
router
    .route("/cancel-service-request-by-customer")
    .post((0, userAuth_1.verifyUserType)(["Customer"]), towingServiceBooking_controller_1.cancelServiceRequestByCustomer);
//for sp
router
    .route("/accept-service-request")
    .post((0, userAuth_1.verifyUserType)(["ServiceProvider"]), towingServiceBooking_controller_1.acceptServiceRequest);
router
    .route("/fetch-customer-request-progresswise")
    .post((0, userAuth_1.verifyUserType)(["Customer"]), towingServiceBooking_controller_1.getUserServiceDetilsByState);
router
    .route("/fetch-all-request")
    .get((0, userAuth_1.verifyUserType)(["SuperAdmin"]), towingServiceBooking_controller_1.fetchTotalServiceByAdmin);
router
    .route("/fetch-request-progresswise-bysp")
    .post((0, userAuth_1.verifyUserType)(["ServiceProvider"]), towingServiceBooking_controller_1.fetchTotalServiceProgresswiseBySp);
router
    .route("/fetch-single-request/:serviceId")
    .get((0, userAuth_1.verifyUserType)(["ServiceProvider", "SuperAdmin", "Customer"]), towingServiceBooking_controller_1.fetchSingleService);
router
    .route("/cancel-service-bysp")
    .post((0, userAuth_1.verifyUserType)(["ServiceProvider"]), towingServiceBooking_controller_1.cancelServiceBySP);
exports.default = router;
