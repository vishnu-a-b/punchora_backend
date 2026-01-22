"use strict";
/**
 * Staff Department Service
 *
 * PHASE 4: Multi-Department Support
 * Handles operations related to staff department assignments
 */
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
const Staff_1 = require("../models/Staff");
const mongoose_1 = __importDefault(require("mongoose"));
class StaffDepartmentService {
    /**
     * Get all staff in a department (primary OR additional)
     */
    getStaffInDepartment(departmentId_1) {
        return __awaiter(this, arguments, void 0, function* (departmentId, options = {}) {
            const query = {
                $or: [
                    { department: departmentId },
                    { additionalDepartments: departmentId },
                ],
            };
            if (!options.includeInactive) {
                query.isActive = true;
            }
            return Staff_1.Staff.find(query)
                .populate("user", "name email")
                .populate("department", "name")
                .populate("additionalDepartments", "name")
                .populate("business", "name")
                .exec();
        });
    }
    /**
     * Get staff's all departments
     */
    getStaffDepartments(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            const staff = yield Staff_1.Staff.findById(staffId)
                .populate("department", "name")
                .populate("additionalDepartments", "name");
            if (!staff) {
                return null;
            }
            return {
                primary: staff.department,
                additional: staff.additionalDepartments || [],
                all: staff.allDepartments, // Virtual field
            };
        });
    }
    /**
     * Add staff to additional department
     */
    addStaffToDepartment(staffId, departmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const staff = yield Staff_1.Staff.findById(staffId);
            if (!staff) {
                throw new Error("Staff not found");
            }
            yield staff.addToDepartment(departmentId);
            return Staff_1.Staff.findById(staffId)
                .populate("department", "name")
                .populate("additionalDepartments", "name");
        });
    }
    /**
     * Remove staff from additional department
     */
    removeStaffFromDepartment(staffId, departmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const staff = yield Staff_1.Staff.findById(staffId);
            if (!staff) {
                throw new Error("Staff not found");
            }
            yield staff.removeFromDepartment(departmentId);
            return Staff_1.Staff.findById(staffId)
                .populate("department", "name")
                .populate("additionalDepartments", "name");
        });
    }
    /**
     * Change staff's primary department
     */
    changePrimaryDepartment(staffId, newPrimaryDepartmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const staff = yield Staff_1.Staff.findById(staffId);
            if (!staff) {
                throw new Error("Staff not found");
            }
            const oldPrimary = staff.department;
            // Update primary department
            staff.department = new mongoose_1.default.Types.ObjectId(newPrimaryDepartmentId);
            // Remove new primary from additional departments if present
            if (staff.additionalDepartments && staff.additionalDepartments.length > 0) {
                staff.additionalDepartments = staff.additionalDepartments.filter((dept) => dept.toString() !== newPrimaryDepartmentId);
            }
            // Optionally add old primary to additional departments
            // (commented out - can be enabled based on business logic)
            // if (oldPrimary && !staff.additionalDepartments) {
            //   staff.additionalDepartments = [];
            // }
            // if (oldPrimary) {
            //   staff.additionalDepartments.push(oldPrimary);
            // }
            yield staff.save();
            return Staff_1.Staff.findById(staffId)
                .populate("department", "name")
                .populate("additionalDepartments", "name");
        });
    }
    /**
     * Check if staff belongs to department
     */
    staffBelongsToDepartment(staffId, departmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const staff = yield Staff_1.Staff.findById(staffId);
            if (!staff) {
                return false;
            }
            return staff.belongsToDepartment(departmentId);
        });
    }
    /**
     * Get departments for multiple staff members
     */
    getBulkStaffDepartments(staffIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const staffList = yield Staff_1.Staff.find({ _id: { $in: staffIds } })
                .populate("department", "name")
                .populate("additionalDepartments", "name");
            const result = new Map();
            staffList.forEach((staff) => {
                result.set(staff._id.toString(), {
                    primary: staff.department,
                    additional: staff.additionalDepartments || [],
                    all: staff.allDepartments,
                });
            });
            return result;
        });
    }
    /**
     * Get count of staff per department (including additional)
     */
    getDepartmentStaffCounts(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const matchQuery = { isActive: true };
            if (businessId) {
                matchQuery.business = new mongoose_1.default.Types.ObjectId(businessId);
            }
            // Count primary departments
            const primaryCounts = yield Staff_1.Staff.aggregate([
                { $match: matchQuery },
                { $group: { _id: "$department", primaryCount: { $sum: 1 } } },
            ]);
            // Count additional departments
            const additionalCounts = yield Staff_1.Staff.aggregate([
                { $match: matchQuery },
                { $unwind: { path: "$additionalDepartments", preserveNullAndEmptyArrays: false } },
                { $group: { _id: "$additionalDepartments", additionalCount: { $sum: 1 } } },
            ]);
            // Combine results
            const countsMap = new Map();
            primaryCounts.forEach((item) => {
                countsMap.set(item._id.toString(), {
                    department: item._id,
                    primaryCount: item.primaryCount,
                    additionalCount: 0,
                    totalCount: item.primaryCount,
                });
            });
            additionalCounts.forEach((item) => {
                const deptId = item._id.toString();
                if (countsMap.has(deptId)) {
                    const existing = countsMap.get(deptId);
                    existing.additionalCount = item.additionalCount;
                    existing.totalCount += item.additionalCount;
                }
                else {
                    countsMap.set(deptId, {
                        department: item._id,
                        primaryCount: 0,
                        additionalCount: item.additionalCount,
                        totalCount: item.additionalCount,
                    });
                }
            });
            return Array.from(countsMap.values());
        });
    }
}
exports.default = StaffDepartmentService;
