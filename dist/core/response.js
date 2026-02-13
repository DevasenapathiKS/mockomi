"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, data, statusCode = 200) {
    return res.status(statusCode).json({ success: true, data });
}
function sendError(res, message, statusCode = 500, errorCode) {
    const payload = errorCode
        ? { success: false, message, errorCode }
        : { success: false, message };
    return res.status(statusCode).json(payload);
}
