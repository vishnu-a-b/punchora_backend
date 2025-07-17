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
const UserAuthenticationService_1 = __importDefault(require("../services/UserAuthenticationService"));
const BaseController_1 = __importDefault(require("../../base/controllers.ts/BaseController"));
const ServerError_1 = __importDefault(require("../../../errors/errorTypes/ServerError"));
const AuthenticationFailedError_1 = __importDefault(require("../../../errors/errorTypes/AuthenticationFailedError"));
const verifyRefreshToken_1 = __importDefault(require("../utils/verifyRefreshToken"));
const User_1 = require("../../user/models/User");
const BadRequestError_1 = __importDefault(require("../../../errors/errorTypes/BadRequestError"));
const CustomError_1 = __importDefault(require("../../../errors/errorTypes/CustomError"));
class UserAuthenticationController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.service = new UserAuthenticationService_1.default();
        this.login = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                if (!user) {
                    throw new AuthenticationFailedError_1.default({ error: "user not found" });
                }
                const tokenData = yield this.service.jwtCreate(user.id);
                this.sendSuccessResponse(res, 200, {
                    message: "user authenticated successfully",
                    data: Object.assign({
                        id: user.id,
                        isSuperAdmin: user.isSuperAdmin,
                        roles: user.roles,
                    }, tokenData),
                });
            }
            catch (e) {
                next(new AuthenticationFailedError_1.default({ error: e.message }));
            }
        });
        this.verifyRefreshToken = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const refreshToken = req.body.refreshToken;
                let userId;
                if (!refreshToken) {
                    throw new BadRequestError_1.default({ error: "invalid refreshToken" });
                }
                try {
                    const { id } = yield (0, verifyRefreshToken_1.default)(refreshToken);
                    userId = id;
                }
                catch (e) {
                    throw new AuthenticationFailedError_1.default({ error: e.message });
                }
                const user = yield User_1.User.findOne({ _id: userId }).populate("roles");
                if (!user) {
                    throw new AuthenticationFailedError_1.default({ error: "user not found" });
                }
                const tokenData = yield this.service.jwtCreate(userId);
                this.sendSuccessResponse(res, 200, {
                    message: "token refreshed successfully",
                    data: Object.assign({
                        id: user.id,
                        isSuperAdmin: user.isSuperAdmin,
                        roles: user.roles,
                    }, tokenData),
                });
            }
            catch (e) {
                if (e instanceof CustomError_1.default) {
                    next(e);
                    return;
                }
                next(new ServerError_1.default({ error: e.error || e.message }));
            }
        });
    }
}
exports.default = UserAuthenticationController;
