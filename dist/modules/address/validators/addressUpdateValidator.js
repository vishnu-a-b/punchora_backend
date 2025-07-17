"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressUpdateValidator = void 0;
const express_validator_1 = require("express-validator");
const customValidators_1 = __importDefault(require("../../base/customValidators/customValidators"));
exports.addressUpdateValidator = [
    (0, express_validator_1.body)("address")
        .optional()
        .custom(customValidators_1.default.isNotEmptyAndString)
        .isLength({ max: 200 }),
    (0, express_validator_1.body)("taluk")
        .optional()
        .custom(customValidators_1.default.isNotEmptyAndString)
        .isLength({ max: 50 }),
    (0, express_validator_1.body)("district")
        .optional()
        .custom(customValidators_1.default.isNotEmptyAndString)
        .isLength({ max: 50 }),
    (0, express_validator_1.body)("pinCode")
        .optional()
        .custom(customValidators_1.default.isNotEmptyAndString)
        .isLength({ max: 10 }),
    (0, express_validator_1.body)("latitude").optional().isNumeric().bail().isLength({ max: 20 }),
    (0, express_validator_1.body)("longitude").optional().isNumeric().bail().isLength({ max: 20 }),
];
