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
const RoleService_1 = __importDefault(require("../services/RoleService"));
const express_validator_1 = require("express-validator");
const ValidationFailedError_1 = __importDefault(require("../../../errors/errorTypes/ValidationFailedError"));
const NotFoundError_1 = __importDefault(require("../../../errors/errorTypes/NotFoundError"));
const mongoose_1 = __importDefault(require("mongoose"));
const BadRequestError_1 = __importDefault(require("../../../errors/errorTypes/BadRequestError"));
class RoleController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.service = new RoleService_1.default();
        this.get = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { limit, skip } = req.query;
                const { filterQuery, sort } = req;
                const data = yield this.service.find({
                    limit: Number(limit),
                    skip: Number(skip),
                    filterQuery,
                    sort,
                });
                this.sendSuccessResponseList(res, 200, { data });
            }
            catch (e) {
                next(e);
            }
        });
        this.getOneBySlug = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const patient = yield this.service.findOneBySlug(req.params.slug);
                if (!patient) {
                    throw new NotFoundError_1.default({ error: "Role not found" });
                }
                this.sendSuccessResponse(res, 200, { data: patient });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid slug" }));
                }
                next(e);
            }
        });
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    next(new ValidationFailedError_1.default({ errors: errors.array() }));
                    return;
                }
                const role = yield this.service.create(req.body);
                this.sendSuccessResponse(res, 201, { data: role });
            }
            catch (e) {
                next(e);
            }
        });
    }
}
exports.default = RoleController;
