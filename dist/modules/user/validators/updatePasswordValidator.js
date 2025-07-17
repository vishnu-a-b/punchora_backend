"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePasswordValidator = void 0;
const express_validator_1 = require("express-validator");
const validatePassword_1 = __importDefault(require("../../authentication/utils/validatePassword"));
const customValidators_1 = __importDefault(require("../../base/customValidators/customValidators"));
exports.updatePasswordValidator = [
    (0, express_validator_1.body)("oldPassword").custom(customValidators_1.default.isNotEmptyAndString).bail(),
    (0, express_validator_1.body)("newPassword")
        .custom(customValidators_1.default.isNotEmptyAndString)
        .bail()
        .custom((password) => {
        try {
            validatePassword_1.default.validate(password);
            return Promise.resolve();
        }
        catch (error) {
            return Promise.reject(error.message);
        }
    }),
];
