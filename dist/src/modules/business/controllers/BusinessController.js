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
const express_validator_1 = require("express-validator");
const ValidationFailedError_1 = __importDefault(require("../../../errors/errorTypes/ValidationFailedError"));
const NotFoundError_1 = __importDefault(require("../../../errors/errorTypes/NotFoundError"));
const mongoose_1 = __importDefault(require("mongoose"));
const BadRequestError_1 = __importDefault(require("../../../errors/errorTypes/BadRequestError"));
const configs_1 = __importDefault(require("../../../configs/configs"));
const UserService_1 = __importDefault(require("../../user/services/UserService"));
const BusinessService_1 = __importDefault(require("../services/BusinessService"));
const roles_1 = __importDefault(require("../../base/enums/roles"));
const Role_1 = require("../../role/models/Role");
const User_1 = require("../../user/models/User");
class BusinessController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.service = new BusinessService_1.default();
        this.userService = new UserService_1.default();
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    next(new ValidationFailedError_1.default({ errors: errors.array() }));
                    return;
                }
                let photoUrls = [];
                if (req.files) {
                    req.files.forEach((file) => {
                        photoUrls.push(configs_1.default.domain + file.filename);
                    });
                    req.body.photos = photoUrls;
                }
                const business = yield this.service.create(req.body);
                const admin = yield this.userService.findOne(req.body.admin);
                const adminRole = yield Role_1.Role.findOne({ slug: roles_1.default.businessAdmin });
                if (admin && adminRole) {
                    const roles = admin.roles.map((role) => role._id);
                    roles.push(adminRole._id);
                    yield User_1.User.findByIdAndUpdate({ _id: admin._id }, {
                        roles,
                    });
                }
                this.sendSuccessResponse(res, 201, { data: business });
            }
            catch (e) {
                next(e);
            }
        });
        this.get = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { limit, skip, search } = req.query;
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
        this.countTotalDocuments = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield this.service.countTotalDocuments();
                this.sendSuccessResponse(res, 200, { data: { count } });
            }
            catch (e) {
                next(e);
            }
        });
        this.getOne = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const business = yield this.service.findOne(req.params.id);
                if (!business) {
                    throw new NotFoundError_1.default({ error: "business not found" });
                }
                this.sendSuccessResponse(res, 200, { data: business });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid business_id" }));
                }
                next(e);
            }
        });
        this.update = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    next(new ValidationFailedError_1.default({ errors: errors.array() }));
                    return;
                }
                let photoUrls = [];
                if (req.files) {
                    req.files.forEach((file) => {
                        photoUrls.push(configs_1.default.domain + file.filename);
                    });
                    req.body.photos = photoUrls;
                }
                const business = yield this.service.update({
                    id: req.params.id,
                    business: req.body,
                });
                if (!business) {
                    throw new NotFoundError_1.default({ error: "business not found" });
                }
                this.sendSuccessResponse(res, 200, { data: { _id: business._id } });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid business_id" }));
                }
                next(e);
            }
        });
        this.updateVcLink = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { vcLink } = req.body;
                if (!vcLink) {
                    next(new ValidationFailedError_1.default({ errors: ["vcLink required"] }));
                    return;
                }
                const business = yield this.service.update({
                    id: req.params.id,
                    business: { vcLink },
                });
                if (!business) {
                    throw new NotFoundError_1.default({ error: "business not found" });
                }
                this.sendSuccessResponse(res, 200, { data: { _id: business._id } });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid business_id" }));
                }
                next(e);
            }
        });
        this.delete = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const business = yield this.service.delete(req.params.id);
                if (!business) {
                    throw new NotFoundError_1.default({ error: "business not found" });
                }
                this.sendSuccessResponse(res, 204, { data: {} });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid business_id" }));
                }
                next(e);
            }
        });
        this.filterByAdmin = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const businesses = yield this.service.filterByAdmin(req.params.id);
                this.sendSuccessResponse(res, 200, { data: businesses });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid admin_d" }));
                }
                next(e);
            }
        });
    }
}
exports.default = BusinessController;
