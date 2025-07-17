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
exports.markAttendanceValidator = void 0;
const express_validator_1 = require("express-validator");
const Staff_1 = require("../../staff/models/Staff");
exports.markAttendanceValidator = [
    (0, express_validator_1.body)("staff").custom((staffId) => __awaiter(void 0, void 0, void 0, function* () {
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
    (0, express_validator_1.body)("date").isISO8601(),
    (0, express_validator_1.body)("checkInLocation").optional(),
    (0, express_validator_1.body)("checkInLocation.latitude").optional().isNumeric(),
    (0, express_validator_1.body)("checkInLocation.longitude").optional().isNumeric(),
    (0, express_validator_1.body)("checkOutLocation").optional(),
    (0, express_validator_1.body)("checkOutLocation.latitude").optional().isNumeric(),
    (0, express_validator_1.body)("checkOutLocation.longitude").optional().isNumeric(),
];
