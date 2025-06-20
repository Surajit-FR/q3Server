import express, { Router } from "express";
import {
    addVehicleType,
    fetchVehicleTypebyId,
    fetchVehicleTypes
} from '../controller/vehicleType.controller';

const router: Router = express.Router();



router.route('/')
    .get(fetchVehicleTypes)
    .post( addVehicleType);


router.route('/:VehicleTypeId').get(fetchVehicleTypebyId);


export default router;