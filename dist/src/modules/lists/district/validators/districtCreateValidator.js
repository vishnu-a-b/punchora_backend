"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.districtCreateValidator = void 0;
const express_validator_1 = require("express-validator");
const customValidators_1 = __importDefault(require("../../../base/customValidators/customValidators"));
exports.districtCreateValidator = [
    (0, express_validator_1.body)("name")
        .custom(customValidators_1.default.isNotEmptyAndString)
        .isLength({ max: 50 }),
];
