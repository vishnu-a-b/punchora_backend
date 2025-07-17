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
exports.generateTokens = void 0;
const configs_1 = __importDefault(require("../../../configs/configs"));
const UserToken_1 = require("../../user/models/UserToken");
const jwt = require("jsonwebtoken");
const generateTokens = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = jwt.sign({ id }, configs_1.default.accessTokenSecret, {
            expiresIn: configs_1.default.accessTokenTimout,
        });
        let refreshToken;
        const userToken = yield UserToken_1.Token.findOne({
            user: id,
        });
        if (userToken) {
            try {
                yield jwt.verify(userToken.refreshToken, configs_1.default.refreshTokenSecret);
                refreshToken = userToken.refreshToken;
            }
            catch (e) { }
        }
        if (!refreshToken) {
            refreshToken = jwt.sign({ id }, configs_1.default.refreshTokenSecret, {
                expiresIn: configs_1.default.refreshTokenTimout,
            });
        }
        if (userToken) {
            const s = yield UserToken_1.Token.deleteOne({ _id: userToken.id });
        }
        yield UserToken_1.Token.create({
            user: id,
            refreshToken: refreshToken,
        });
        return Promise.resolve({ accessToken, refreshToken });
    }
    catch (err) {
        return Promise.reject(err);
    }
});
exports.generateTokens = generateTokens;
