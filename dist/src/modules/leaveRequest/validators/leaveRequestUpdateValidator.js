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
exports.leaveRequestUpdateValidator = void 0;
const express_validator_1 = require("express-validator");
const customValidators_1 = __importDefault(require("../../base/customValidators/customValidators"));
const Staff_1 = require("../../staff/models/Staff");
const Department_1 = require("../../department/models/Department");
const leaveStatus_1 = require("../../base/enums/leaveStatus");
exports.leaveRequestUpdateValidator = [
    (0, express_validator_1.body)("reason").optional().custom(customValidators_1.default.isNotEmptyAndString),
    (0, express_validator_1.body)("remarks").optional().custom(customValidators_1.default.isNotEmptyAndString),
    (0, express_validator_1.body)("staff")
        .optional()
        .custom((staffId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const staff = yield Staff_1.Staff.findById(staffId);
            if (!staff) {
                return Promise.reject("staff not found");
            }
            return Promise.resolve();
        }
        catch (_) {
            return Promise.reject();
        }
    })),
    (0, express_validator_1.body)("department")
        .optional()
        .custom((departmentId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const department = yield Department_1.Department.findById(departmentId);
            if (!department) {
                return Promise.reject("department not found");
            }
            return Promise.resolve();
        }
        catch (_) {
            return Promise.reject();
        }
    })),
    (0, express_validator_1.body)("leaveDates")
        .optional()
        .isArray({ min: 1 })
        .withMessage("Leave dates must be an array with at least one date.")
        .custom((dates) => {
        return dates.every((date) => !isNaN(new Date(date).getTime()));
    })
        .withMessage("Each leave date must be a valid date."),
    (0, express_validator_1.body)("status").optional().isIn(Object.values(leaveStatus_1.LeaveStatus)),
];
