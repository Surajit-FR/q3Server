"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocations = getLocations;
const square_1 = require("square");
const config_1 = require("./config");
const client = new square_1.SquareClient({
    token: config_1.SQUARE_ACCESS_TOKEN,
    environment: square_1.SquareEnvironment.Sandbox,
});
function getLocations() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Function runs...: getLocations");
            let listLocationsResponse = yield client.locations.list();
            let locations = listLocationsResponse.locations;
            let locationId;
            if (locations && (locations === null || locations === void 0 ? void 0 : locations.length) > 0) {
                locations.forEach(function (location) {
                    var _a, _b;
                    locationId = location.id;
                    console.log(location.id +
                        ": " +
                        location.name +
                        ", " +
                        ((_a = location.address) === null || _a === void 0 ? void 0 : _a.addressLine1) +
                        ", " +
                        ((_b = location.address) === null || _b === void 0 ? void 0 : _b.locality));
                });
                return locationId;
            }
        }
        catch (error) {
            if (error instanceof square_1.SquareError) {
                error.errors.forEach(function (e) {
                    console.log(e.category);
                    console.log(e.code);
                    console.log(e.detail);
                });
            }
            else {
                console.log("Unexpected error occurred: ", error);
            }
        }
    });
}
