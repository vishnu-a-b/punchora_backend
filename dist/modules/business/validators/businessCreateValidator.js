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
exports.businessCreateValidator = void 0;
const express_validator_1 = require("express-validator");
const customValidators_1 = __importDefault(require("../../base/customValidators/customValidators"));
const Address_1 = require("../../address/models/Address");
const managementTypes_1 = require("../../base/enums/managementTypes");
const User_1 = require("../../user/models/User");
exports.businessCreateValidator = [
    (0, express_validator_1.body)("name")
        .custom(customValidators_1.default.isNotEmptyAndString)
        .isLength({ max: 50 }),
    (0, express_validator_1.body)("address")
        .optional()
        .custom((addressId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const address = yield Address_1.Address.findById(addressId);
            if (!address) {
                return Promise.reject("address not found");
            }
            return Promise.resolve();
        }
        catch (_) {
            return Promise.reject();
        }
    })),
    (0, express_validator_1.body)("managementType").optional().isIn(Object.values(managementTypes_1.ManagementTypes)),
    (0, express_validator_1.body)("contactMobileNumbers")
        .optional()
        .isArray()
        .bail()
        .custom((numbers) => __awaiter(void 0, void 0, void 0, function* () {
        const areAllStrings = numbers.every(function (number) {
            return typeof number === "string";
        });
        if (!areAllStrings) {
            return Promise.reject("contactMobileNumbers should be an array of strings");
        }
    })),
    (0, express_validator_1.body)("contactLandlines")
        .optional()
        .isArray()
        .bail()
        .custom((numbers) => __awaiter(void 0, void 0, void 0, function* () {
        const areAllStrings = numbers.every(function (number) {
            return typeof number === "string";
        });
        if (!areAllStrings) {
            return Promise.reject("contactLandlines should be an array of strings");
        }
    })),
    (0, express_validator_1.body)("admin")
        .optional()
        .custom((adminId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const admin = yield User_1.User.findById(adminId);
            if (!admin) {
                return Promise.reject("user not found");
            }
            return Promise.resolve();
        }
        catch (_) {
            return Promise.reject();
        }
    })),
];
