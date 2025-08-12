"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const constants_1 = require("./constants");
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const vehicleType_route_1 = __importDefault(require("./routes/vehicleType.route"));
const towingServiceBooking_route_1 = __importDefault(require("./routes/towingServiceBooking.route"));
const locationSession_route_1 = __importDefault(require("./routes/locationSession.route"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const app = (0, express_1.default)();
exports.app = app;
//  CORS Middleware
app.use((0, cors_1.default)({
    origin: [
        process.env.CORS_ORIGIN,
        "http://localhost:9000",
        "http://localhost:5173",
        "http://3.110.157.24",
    ],
    credentials: true,
}));
// General Middleware
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json({ limit: constants_1.EXPRESS_CONFIG_LIMIT })); // JSON Parsing for Other Routes
app.use(express_1.default.urlencoded({ extended: true, limit: constants_1.EXPRESS_CONFIG_LIMIT }));
app.use(express_1.default.static("public"));
app.use((0, cookie_parser_1.default)());
//API routes
app.use("/api/v1/auth", auth_route_1.default);
app.use("/api/v1/", upload_routes_1.default);
app.use("/api/v1/vehicle-type", vehicleType_route_1.default);
app.use("/api/v1/service", towingServiceBooking_route_1.default);
app.use("/api/v1/location-session", locationSession_route_1.default);
app.use("/api/v1/user", user_route_1.default);
//  Ping Route for Health Check
app.get("/api/v1/ping", (req, res) => {
    res.send("Hi!...I am server, Happy to see you boss...");
});
//  Internal Server Error Handling
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({
        status: 500,
        message: "Server Error",
        error: err.message,
    });
});
//  404 Not Found Middleware
app.use((req, res, next) => {
    res.status(404).json({
        status: 404,
        message: "Endpoint Not Found",
    });
});
