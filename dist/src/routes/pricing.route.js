"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pricing_controller_1 = require("../controller/pricing.controller");
const router = express_1.default.Router();
router.route('/')
    .get(pricing_controller_1.fetchPricingRule);
router.route('/:id').put(pricing_controller_1.updatePricingRule);
router.route('/custom-rule')
    .get(pricing_controller_1.fetchCustomPricingRule);
router.route('/custom-rule/:id').put(pricing_controller_1.updateCustomRule);
exports.default = router;
