import express, { Router } from "express";
import {
    enableLocation,
    disableLocation,
    getTotalOnlineTime
} from '../controller/locationSession.controller';
import { VerifyJWTToken } from "../middlewares/auth/userAuth";

const router: Router = express.Router();


router.use(VerifyJWTToken)

router.route('/enable-location').post(enableLocation);
router.route('/disable-location').get(disableLocation);
router.route('/get-total-online_duration').get(getTotalOnlineTime);




export default router;