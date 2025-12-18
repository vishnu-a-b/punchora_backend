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
const roles_1 = require("../../../constants/roles");
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
        /**
         * Get pending approvals filtered by role
         */
        this.getPendingApprovals = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                let query = {};
                if (user.role === roles_1.UserRole.DEPARTMENT_HEAD) {
                    // Get staff IDs in this department
                    const Staff = mongoose_1.default.model('Staff');
                    const staffInDept = yield Staff.find({ department: user.department }).select('_id');
                    const staffIds = staffInDept.map((s) => s._id);
                    query = {
                        staff: { $in: staffIds },
                        status: leaveStatus_1.LeaveStatus.pending
                    };
                }
                else if (user.role === roles_1.UserRole.HR_ADMIN) {
                    // Get leaves pending HR approval
                    query = {
                        status: leaveStatus_1.LeaveStatus.pending_hr_approval
                    };
                }
                else {
                    // Business/Super admin can see all
                    query = {
                        status: { $in: [leaveStatus_1.LeaveStatus.pending, leaveStatus_1.LeaveStatus.pending_hr_approval] }
                    };
                }
                const leaves = yield LeaveRequest_1.LeaveRequest.find(query)
                    .populate('staff', 'name email')
                    .populate('department', 'name')
                    .sort({ createdAt: -1 })
                    .limit(100);
                this.sendSuccessResponse(res, 200, { data: leaves });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Department Head approves leave (Level 1)
         */
        this.approveLeaveDeptHead = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { id } = req.params;
                const { comments } = req.body;
                const user = req.user;
                const leave = yield LeaveRequest_1.LeaveRequest.findById(id).populate('staff');
                if (!leave) {
                    throw new NotFoundError_1.default({ error: 'Leave request not found' });
                }
                if (leave.status !== leaveStatus_1.LeaveStatus.pending) {
                    throw new BadRequestError_1.default({ error: 'Leave is not in pending status' });
                }
                // Check department access for dept heads
                if (user.role === roles_1.UserRole.DEPARTMENT_HEAD) {
                    const staff = leave.staff;
                    if (((_a = staff.department) === null || _a === void 0 ? void 0 : _a.toString()) !== ((_b = user.department) === null || _b === void 0 ? void 0 : _b.toString())) {
                        throw new BadRequestError_1.default({ error: 'You can only approve leaves for your department' });
                    }
                }
                leave.departmentHeadApproval = {
                    approvedBy: user._id,
                    approvedAt: new Date(),
                    status: 'approved',
                    comments: comments || ''
                };
                leave.status = leaveStatus_1.LeaveStatus.pending_hr_approval;
                yield leave.save();
                this.sendSuccessResponse(res, 200, {
                    message: 'Leave approved by department head, pending HR approval',
                    data: leave
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Department Head rejects leave (Level 1)
         */
        this.rejectLeaveDeptHead = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { id } = req.params;
                const { comments } = req.body;
                const user = req.user;
                const leave = yield LeaveRequest_1.LeaveRequest.findById(id).populate('staff');
                if (!leave) {
                    throw new NotFoundError_1.default({ error: 'Leave request not found' });
                }
                if (leave.status !== leaveStatus_1.LeaveStatus.pending) {
                    throw new BadRequestError_1.default({ error: 'Leave is not in pending status' });
                }
                // Check department access for dept heads
                if (user.role === roles_1.UserRole.DEPARTMENT_HEAD) {
                    const staff = leave.staff;
                    if (((_a = staff.department) === null || _a === void 0 ? void 0 : _a.toString()) !== ((_b = user.department) === null || _b === void 0 ? void 0 : _b.toString())) {
                        throw new BadRequestError_1.default({ error: 'You can only reject leaves for your department' });
                    }
                }
                leave.departmentHeadApproval = {
                    approvedBy: user._id,
                    approvedAt: new Date(),
                    status: 'rejected',
                    comments: comments || ''
                };
                leave.status = leaveStatus_1.LeaveStatus.rejected_by_dept_head;
                yield leave.save();
                this.sendSuccessResponse(res, 200, {
                    message: 'Leave rejected by department head',
                    data: leave
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * HR approves leave (Level 2)
         */
        this.approveLeaveHR = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { comments } = req.body;
                const user = req.user;
                const leave = yield LeaveRequest_1.LeaveRequest.findById(id);
                if (!leave) {
                    throw new NotFoundError_1.default({ error: 'Leave request not found' });
                }
                if (leave.status !== leaveStatus_1.LeaveStatus.pending_hr_approval) {
                    throw new BadRequestError_1.default({ error: 'Leave is not pending HR approval' });
                }
                leave.hrApproval = {
                    approvedBy: user._id,
                    approvedAt: new Date(),
                    status: 'approved',
                    comments: comments || ''
                };
                leave.status = leaveStatus_1.LeaveStatus.approved;
                yield leave.save();
                this.sendSuccessResponse(res, 200, {
                    message: 'Leave approved by HR',
                    data: leave
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * HR rejects leave (Level 2)
         */
        this.rejectLeaveHR = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { comments } = req.body;
                const user = req.user;
                const leave = yield LeaveRequest_1.LeaveRequest.findById(id);
                if (!leave) {
                    throw new NotFoundError_1.default({ error: 'Leave request not found' });
                }
                if (leave.status !== leaveStatus_1.LeaveStatus.pending_hr_approval) {
                    throw new BadRequestError_1.default({ error: 'Leave is not pending HR approval' });
                }
                leave.hrApproval = {
                    approvedBy: user._id,
                    approvedAt: new Date(),
                    status: 'rejected',
                    comments: comments || ''
                };
                leave.status = leaveStatus_1.LeaveStatus.rejected_by_hr;
                yield leave.save();
                this.sendSuccessResponse(res, 200, {
                    message: 'Leave rejected by HR',
                    data: leave
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = LeaveRequestController;
