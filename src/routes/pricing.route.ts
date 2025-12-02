import express, { Router } from "express";
import {
    fetchCustomPricingRule,
    fetchPricingRule,
    updateCustomRule,
    updatePricingRule
} from '../controller/pricing.controller';


const router: Router = express.Router();

router.route('/')
    .get(fetchPricingRule)


router.route('/:id').put(updatePricingRule);

router.route('/custom-rule')
    .get(fetchCustomPricingRule)


router.route('/custom-rule/:id').put(updateCustomRule);

export default router;
