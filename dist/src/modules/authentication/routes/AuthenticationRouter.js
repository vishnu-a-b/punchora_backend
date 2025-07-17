"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserAuthenticationController_1 = __importDefault(require("../controllers/UserAuthenticationController"));
const loginMiddleware_1 = require("../middlewares/loginMiddleware");
const verifyRefreshTokenValidationChain_1 = require("../validators/verifyRefreshTokenValidationChain");
const jwtCreateDoc_1 = require("../docs/jwtCreateDoc");
const jwtVerifyDoc_1 = require("../docs/jwtVerifyDoc");
const router = express_1.default.Router();
const controller = new UserAuthenticationController_1.default();
router.post("/jwt/create", loginMiddleware_1.loginMiddleware, jwtCreateDoc_1.jwtCreateDoc, controller.login);
router.post("/jwt/verify", verifyRefreshTokenValidationChain_1.verifyRefreshTokenValidationChain, jwtVerifyDoc_1.jwtVerifyDoc, controller.verifyRefreshToken);
exports.default = router;
