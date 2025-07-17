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
const BaseController_1 = __importDefault(require("../../base/controllers.ts/BaseController"));
const UserService_1 = __importDefault(require("../../user/services/UserService"));
const NotFoundError_1 = __importDefault(require("../../../errors/errorTypes/NotFoundError"));
class AccountDetailsController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.userService = new UserService_1.default();
        this.details = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.userService.findOne(req.user._id);
                if (!user) {
                    throw new NotFoundError_1.default({ error: "user not found" });
                }
                this.sendSuccessResponse(res, 200, { data: user });
            }
            catch (e) {
                next(e);
            }
        });
    }
}
exports.default = AccountDetailsController;
