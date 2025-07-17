"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PermissionDeniedError_1 = __importDefault(require("../errors/errorTypes/PermissionDeniedError"));
const authorizeUser = ({ allowedRoles }) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            if (user.isSuperAdmin) {
                next();
                return;
            }
            const userRoles = user.roles.map((role) => role.slug);
            for (const role of userRoles) {
                if (allowedRoles.includes(role)) {
                    next();
                    return;
                }
            }
            next(new PermissionDeniedError_1.default({
                error: "you are not allowed to perform this action",
            }));
        }
        catch (e) {
            next(e);
        }
    };
};
exports.default = authorizeUser;
