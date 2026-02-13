"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
const response_1 = require("../../../core/response");
class AuthController {
    constructor() {
        this.register = async (req, res, next) => {
            try {
                const { email, password } = req.body;
                const user = await this.authService.register({ email, password });
                (0, response_1.sendSuccess)(res, user);
            }
            catch (error) {
                next(error);
            }
        };
        this.login = async (req, res, next) => {
            try {
                const { email, password } = req.body;
                const result = await this.authService.login({ email, password });
                (0, response_1.sendSuccess)(res, result);
            }
            catch (error) {
                next(error);
            }
        };
        this.authService = new AuthService_1.AuthService();
    }
}
exports.AuthController = AuthController;
