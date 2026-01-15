import express, { Router } from "express";

import { VerifyJWTToken } from "../middlewares/auth/userAuth";
import { createSquareCheckoutsession } from "../controller/square.controller";

const router: Router = express.Router();

//STRIPE API ROUTES
router.use(VerifyJWTToken);

router.post("/create-checkout",createSquareCheckoutsession);



export default router;