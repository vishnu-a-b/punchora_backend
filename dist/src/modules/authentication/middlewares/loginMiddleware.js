"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginMiddleware = void 0;
const AuthenticationFailedError_1 = __importDefault(require("../../../errors/errorTypes/AuthenticationFailedError"));
const passport = require("passport");
const loginMiddleware = (req, res, next) => {
    passport.authenticate("local", (error, user) => {
        if (error) {
            next(new AuthenticationFailedError_1.default({ error }));
        }
        if (!user) {
            next(new AuthenticationFailedError_1.default({
                error: "username or password is invalid",
            }));
        }
        req.user = user;
        next();
    })(req, res, next);
};
exports.loginMiddleware = loginMiddleware;
