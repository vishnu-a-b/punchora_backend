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
const StaffDepartmentService_1 = __importDefault(require("../services/StaffDepartmentService"));
const BadRequestError_1 = __importDefault(require("../../../errors/errorTypes/BadRequestError"));
const NotFoundError_1 = __importDefault(require("../../../errors/errorTypes/NotFoundError"));
/**
 * PHASE 4: Multi-Department Controller
 * Handles staff department assignment operations
 */
class StaffDepartmentController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.service = new StaffDepartmentService_1.default();
        /**
         * Get all staff in a department
         * GET /v1/staff/department/:departmentId
         */
        this.getStaffInDepartment = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { departmentId } = req.params;
                const { includeInactive } = req.query;
                const staff = yield this.service.getStaffInDepartment(departmentId, {
                    includeInactive: includeInactive === "true",
                });
                this.sendSuccessResponse(res, 200, {
                    message: "Staff retrieved successfully",
                    data: staff,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get staff's all departments
         * GET /v1/staff/:id/departments
         */
        this.getStaffDepartments = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const departments = yield this.service.getStaffDepartments(id);
                if (!departments) {
                    throw new NotFoundError_1.default({ error: "Staff not found" });
                }
                this.sendSuccessResponse(res, 200, {
                    message: "Staff departments retrieved successfully",
                    data: departments,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Add staff to additional department
         * POST /v1/staff/:id/departments
         */
        this.addStaffToDepartment = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { departmentId } = req.body;
                if (!departmentId) {
                    throw new BadRequestError_1.default({ error: "departmentId is required" });
                }
                const staff = yield this.service.addStaffToDepartment(id, departmentId);
                this.sendSuccessResponse(res, 200, {
                    message: "Staff added to department successfully",
                    data: staff,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Remove staff from additional department
         * DELETE /v1/staff/:id/departments/:departmentId
         */
        this.removeStaffFromDepartment = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, departmentId } = req.params;
                const staff = yield this.service.removeStaffFromDepartment(id, departmentId);
                this.sendSuccessResponse(res, 200, {
                    message: "Staff removed from department successfully",
                    data: staff,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Change staff's primary department
         * PUT /v1/staff/:id/primary-department
         */
        this.changePrimaryDepartment = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { departmentId } = req.body;
                if (!departmentId) {
                    throw new BadRequestError_1.default({ error: "departmentId is required" });
                }
                const staff = yield this.service.changePrimaryDepartment(id, departmentId);
                this.sendSuccessResponse(res, 200, {
                    message: "Primary department changed successfully",
                    data: staff,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get department staff counts
         * GET /v1/staff/departments/counts
         */
        this.getDepartmentStaffCounts = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { business } = req.query;
                const businessFilter = req.businessFilter;
                const counts = yield this.service.getDepartmentStaffCounts(businessFilter || business);
                this.sendSuccessResponse(res, 200, {
                    message: "Department staff counts retrieved successfully",
                    data: counts,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = StaffDepartmentController;
