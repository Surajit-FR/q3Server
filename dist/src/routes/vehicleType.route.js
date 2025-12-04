"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const vehicleType_controller_1 = require("../controller/vehicleType.controller");
const router = express_1.default.Router();
router.route('/')
    .get(vehicleType_controller_1.fetchVehicleTypes)
    .post(vehicleType_controller_1.addVehicleType);
router.route('/:VehicleTypeId').get(vehicleType_controller_1.fetchVehicleTypebyId);
exports.default = router;
