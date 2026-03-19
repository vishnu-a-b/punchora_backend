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
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffCreateValidator = void 0;
const express_validator_1 = require("express-validator");
const User_1 = require("../../user/models/User");
const Department_1 = require("../../department/models/Department");
const staffRoles_1 = require("../../base/enums/staffRoles");
const Staff_1 = require("../models/Staff");
const Business_1 = require("../../business/models/Business");
const staffTypes_1 = require("../../base/enums/staffTypes");
exports.staffCreateValidator = [
    (0, express_validator_1.body)("user").custom((userId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = yield User_1.User.findById(userId);
            if (!user) {
                return Promise.reject("user not found");
            }
            const staff = yield Staff_1.Staff.find({ user: user._id });
            if (staff && staff.length > 0) {
                return Promise.reject("there is already a staff for that userId");
            }
            return Promise.resolve();
        }
        catch (_) {
            return Promise.reject();
        }
    })),
    (0, express_validator_1.body)("department").custom((departmentId) => __awaiter(void 0, void 0, void 0, function* () {
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
    (0, express_validator_1.body)("business").custom((businessId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const business = yield Business_1.Business.findById(businessId);
            if (!business) {
                return Promise.reject("business not found");
            }
            return Promise.resolve();
        }
        catch (_) {
            return Promise.reject();
        }
    })),
    (0, express_validator_1.body)("joinDate").isISO8601(),
    (0, express_validator_1.body)("role").isIn(Object.values(staffRoles_1.StaffRoles)),
    (0, express_validator_1.body)("type").isIn(Object.values(staffTypes_1.StaffTypes)),
    (0, express_validator_1.body)("otEnabled").optional().isBoolean(),
    (0, express_validator_1.body)("otMultiplier").optional().isFloat({ min: 1 }),
    (0, express_validator_1.body)("weeklyOff").optional().isIn(["weekly-off", "no-off", "night-off"]),
    (0, express_validator_1.body)("extraOff").optional().isInt({ min: 0 }),
];
