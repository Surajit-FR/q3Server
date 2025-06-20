import express, { Router } from "express";
import { getSingleUser, getAllCustomer, getAllProviders } from "../controller/user.controller";

const router: Router = express.Router();



router.route('/fetch-single-user').get(getSingleUser)
router.route('/fetch-customers').get(getAllCustomer)
router.route('/fetch-poviders').get(getAllProviders)




export default router;