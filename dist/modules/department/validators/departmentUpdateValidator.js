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
exports.departmentUpdateValidator = void 0;
const express_validator_1 = require("express-validator");
const customValidators_1 = __importDefault(require("../../base/customValidators/customValidators"));
const User_1 = require("../../user/models/User");
const Business_1 = require("../../business/models/Business");
exports.departmentUpdateValidator = [
    (0, express_validator_1.body)("name")
        .optional()
        .custom(customValidators_1.default.isNotEmptyAndString)
        .isLength({ max: 50 }),
    (0, express_validator_1.body)("business")
        .optional()
        .custom((businessId) => __awaiter(void 0, void 0, void 0, function* () {
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
    (0, express_validator_1.body)("head")
        .optional()
        .custom((headId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const head = yield User_1.User.findById(headId);
            if (!head) {
                return Promise.reject("user not found");
            }
            return Promise.resolve();
        }
        catch (_) {
            return Promise.reject();
        }
    })),
];
