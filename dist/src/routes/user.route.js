"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controller/user.controller");
const userAuth_1 = require("../middlewares/auth/userAuth");
const router = express_1.default.Router();
router.route("/fetch-single-user").get(user_controller_1.getSingleUser);
router.route("/fetch-customers").get(user_controller_1.getAllCustomer);
router.route("/fetch-poviders").get(user_controller_1.getAllProviders);
router.use(userAuth_1.VerifyJWTToken);
router.route("/give-rating").post((0, userAuth_1.verifyUserType)(["Customer"]), user_controller_1.giveRating);
exports.default = router;
