import express, { Router } from "express";
import { squareWebhook } from "../controller/squareWebhook.controller";

const router: Router = express.Router();



//STRIPE WEBHOOK ROUTE

router.post("/webhook", express.raw({ type: "application/json" }), squareWebhook);





export default router;