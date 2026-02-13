"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const AuthService_1 = require("../modules/auth/services/AuthService");
const error_1 = require("./error");
const authService = new AuthService_1.AuthService();
const authenticate = (req, _res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header) {
            next(new error_1.AppError('Unauthorized', 401));
            return;
        }
        const [scheme, token] = header.split(' ');
        if (scheme !== 'Bearer' || !token) {
            next(new error_1.AppError('Unauthorized', 401));
            return;
        }
        const decoded = authService.verifyToken(token);
        req.user = { userId: decoded.userId, role: decoded.role };
        next();
    }
    catch (_error) {
        next(new error_1.AppError('Unauthorized', 401));
    }
};
exports.authenticate = authenticate;
