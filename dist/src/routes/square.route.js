"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userAuth_1 = require("../middlewares/auth/userAuth");
const square_controller_1 = require("../controller/square.controller");
const router = express_1.default.Router();
//STRIPE API ROUTES
router.use(userAuth_1.VerifyJWTToken);
router.post("/create-checkout", square_controller_1.createSquareCheckoutsession);
exports.default = router;
