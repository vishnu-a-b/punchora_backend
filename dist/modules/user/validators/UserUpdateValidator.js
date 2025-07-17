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
exports.userUpdateValidator = void 0;
const express_validator_1 = require("express-validator");
const customValidators_1 = __importDefault(require("../../base/customValidators/customValidators"));
const genders_1 = require("../../base/enums/genders");
const maritalStatuses_1 = require("../../base/enums/maritalStatuses");
const Role_1 = require("../../role/models/Role");
const validatePassword_1 = __importDefault(require("../../authentication/utils/validatePassword"));
exports.userUpdateValidator = [
    (0, express_validator_1.body)("name")
        .optional()
        .custom(customValidators_1.default.isNotEmptyAndString)
        .bail()
        .isLength({ max: 100 }),
    (0, express_validator_1.body)("password")
        .optional()
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
    (0, express_validator_1.body)("email").optional().isEmail().isLength({ max: 100 }),
    (0, express_validator_1.body)("dateOfBirth").optional().isISO8601(),
    (0, express_validator_1.body)("gender").optional().isIn(Object.values(genders_1.Genders)),
    (0, express_validator_1.body)("maritalStatus").optional().isIn(Object.values(maritalStatuses_1.MaritalStatuses)),
    (0, express_validator_1.body)("roles")
        .optional()
        .isArray()
        .bail()
        .custom((roles) => __awaiter(void 0, void 0, void 0, function* () {
        const areAllStrings = roles.every(function (item) {
            return typeof item === "string";
        });
        if (!areAllStrings) {
            return Promise.reject("roles should be an array of ids");
        }
        const existingRoles = yield Role_1.Role.find({ _id: { $in: roles } });
        if (existingRoles.length !== roles.length) {
            return Promise.reject("invalid role ids provided");
        }
    })),
    (0, express_validator_1.body)("isActive").optional().isBoolean(),
];
