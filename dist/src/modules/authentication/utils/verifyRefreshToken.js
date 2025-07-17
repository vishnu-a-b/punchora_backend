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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const configs_1 = __importDefault(require("../../../configs/configs"));
const UserToken_1 = require("../../user/models/UserToken");
const jwt = require("jsonwebtoken");
const verifyRefreshToken = (refreshToken) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield UserToken_1.Token.findOne({
                refreshToken: refreshToken,
            });
            jwt.verify(refreshToken, configs_1.default.refreshTokenSecret, (error, payload) => {
                if (error) {
                    return reject({ message: "Invalid refresh token" });
                }
                return resolve(payload);
            });
        }
        catch (e) {
            return reject({ message: "Invalid refresh token" });
        }
    }));
};
exports.default = verifyRefreshToken;
