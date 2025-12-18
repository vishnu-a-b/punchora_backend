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
const FailedLocationAttemptService_1 = __importDefault(require("../services/FailedLocationAttemptService"));
class FailedLocationAttemptController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.service = new FailedLocationAttemptService_1.default();
        this.list = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { limit, skip, search } = req.query;
                const { filterQuery, sort } = req;
                const data = yield this.service.list({
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
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    next(new ValidationFailedError_1.default({ errors: errors.array() }));
                    return;
                }
                const attempt = yield this.service.create(req.body);
                this.sendSuccessResponse(res, 201, { data: attempt });
            }
            catch (e) {
                next(e);
            }
        });
        this.insertMany = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.service.insertMany(req.body);
                this.sendSuccessResponse(res, 201, { data: data });
            }
            catch (e) {
                next(e);
            }
        });
        this.filterByDate = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { startDate, endDate, staff } = req.query;
                if (!(startDate && endDate)) {
                    throw new ValidationFailedError_1.default({
                        errors: ["startDate & endDate required as query parameters"],
                    });
                }
                const data = yield this.service.filterByDate(new Date(startDate), new Date(endDate), staff);
                this.sendSuccessResponse(res, 200, { data });
            }
            catch (e) {
                next(e);
            }
        });
        this.getOne = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const attempt = yield this.service.findOne(req.params.id);
                if (!attempt) {
                    throw new NotFoundError_1.default({ error: "Failed location attempt not found" });
                }
                this.sendSuccessResponse(res, 200, { data: attempt });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid attempt_id" }));
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
                const attempt = yield this.service.update({
                    id: req.params.id,
                    body: req.body,
                });
                if (!attempt) {
                    throw new NotFoundError_1.default({ error: "Failed location attempt not found" });
                }
                this.sendSuccessResponse(res, 200, { data: { _id: attempt._id } });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid attempt_id" }));
                }
                next(e);
            }
        });
        this.delete = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const attempt = yield this.service.delete(req.params.id);
                if (!attempt) {
                    throw new NotFoundError_1.default({ error: "Failed location attempt not found" });
                }
                this.sendSuccessResponse(res, 204, { data: {} });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid attempt_id" }));
                }
                next(e);
            }
        });
    }
}
exports.default = FailedLocationAttemptController;
