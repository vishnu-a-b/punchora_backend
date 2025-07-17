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
const BaseController_1 = __importDefault(require("../../../base/controllers.ts/BaseController"));
const express_validator_1 = require("express-validator");
const ValidationFailedError_1 = __importDefault(require("../../../../errors/errorTypes/ValidationFailedError"));
const DistrictService_1 = __importDefault(require("../services/DistrictService"));
class DistrictController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.service = new DistrictService_1.default();
        this.list = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { filterQuery, sort } = req;
                const data = yield this.service.list({
                    limit: 100,
                    skip: 0,
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
                const district = yield this.service.create(req.body);
                this.sendSuccessResponse(res, 201, { data: district });
            }
            catch (e) {
                next(e);
            }
        });
        this.delete = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.service.delete(req.params.id);
                this.sendSuccessResponse(res, 204, { data: {} });
            }
            catch (e) {
                next(e);
            }
        });
    }
}
exports.default = DistrictController;
