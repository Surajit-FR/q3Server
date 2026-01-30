"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../constants");
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose_1.default.connect(`${process.env.MONGODB_URI}/${constants_1.DB_NAME}`);
        //current date and time
        const currentDate = new Date().toLocaleString();
        const dbInfo = {
            STATUS: "Connected",
            HOST: connectionInstance.connection.host,
            DATE_TIME: currentDate,
        };
        console.log("\n🛢  MongoDB Connection Established");
        console.table(dbInfo);
    }
    catch (error) {
        console.log("MongoDB Connection Error", error);
        process.exit(1);
    }
};
exports.default = connectDB;
