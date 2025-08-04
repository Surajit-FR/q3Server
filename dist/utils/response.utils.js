"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleResponse = handleResponse;
function handleResponse(res, status, statusCode, data, message) {
    const response = {
        status: status,
        data: data,
        message: message,
    };
    res.status(statusCode).json(response);
}
