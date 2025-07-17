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
const LeaveRequestService_1 = __importDefault(require("../services/LeaveRequestService"));
const LeaveRequest_1 = require("../models/LeaveRequest");
const leaveStatus_1 = require("../../base/enums/leaveStatus");
class LeaveRequestController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.service = new LeaveRequestService_1.default();
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    next(new ValidationFailedError_1.default({ errors: errors.array() }));
                    return;
                }
                const request = yield this.service.createLeaveRequest(req.body);
                this.sendSuccessResponse(res, 201, { data: request });
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
        this.update = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    next(new ValidationFailedError_1.default({ errors: errors.array() }));
                    return;
                }
                const request = yield LeaveRequest_1.LeaveRequest.findById(req.params.id);
                if (!request) {
                    throw new Error("No leave request found");
                }
                if (request.status !== leaveStatus_1.LeaveStatus.pending.toString()) {
                    throw new Error("Not permitted to edit this request");
                }
                const { reason, leaveDates } = req.body;
                const leave = yield this.service.update({
                    id: req.params.id,
                    data: { reason, leaveDates },
                });
                if (!leave) {
                    throw new NotFoundError_1.default({ error: "leave request not found" });
                }
                this.sendSuccessResponse(res, 200, { data: { _id: leave._id } });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid leave_request_id" }));
                }
                next(e);
            }
        });
        this.accept = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    next(new ValidationFailedError_1.default({ errors: errors.array() }));
                    return;
                }
                const request = yield LeaveRequest_1.LeaveRequest.findById(req.params.id);
                if (!request) {
                    throw new Error("No leave request found");
                }
                if (request.status !== leaveStatus_1.LeaveStatus.pending.toString()) {
                    throw new Error("Not permitted to edit this request");
                }
                const { status, remarks } = req.body;
                const leave = yield this.service.validateLeaveRequest({
                    id: req.params.id,
                    data: { status, remarks },
                });
                if (!leave) {
                    throw new NotFoundError_1.default({ error: "leave request not found" });
                }
                this.sendSuccessResponse(res, 200, { data: { _id: leave._id } });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid leave request_id" }));
                }
                next(e);
            }
        });
        this.delete = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const request = yield LeaveRequest_1.LeaveRequest.findById(req.params.id);
                if (!request) {
                    throw new Error("No leave request found");
                }
                if (request.status !== leaveStatus_1.LeaveStatus.pending.toString()) {
                    throw new Error("Not permitted to delete this request");
                }
                const leave = yield this.service.delete(req.params.id);
                if (!leave) {
                    throw new NotFoundError_1.default({ error: "leave request not found" });
                }
                this.sendSuccessResponse(res, 204, { data: {} });
            }
            catch (e) {
                if (e instanceof mongoose_1.default.Error.CastError) {
                    next(new BadRequestError_1.default({ error: "invalid leave_request_id" }));
                }
                next(e);
            }
        });
    }
}
exports.default = LeaveRequestController;
