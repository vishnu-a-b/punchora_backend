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
exports.roleCreateValidator = void 0;
const express_validator_1 = require("express-validator");
const Role_1 = require("../models/Role");
const customValidators_1 = __importDefault(require("../../base/customValidators/customValidators"));
exports.roleCreateValidator = [
    (0, express_validator_1.body)("title")
        .custom(customValidators_1.default.isNotEmptyAndString)
        .isLength({ max: 50 }),
    (0, express_validator_1.body)("slug")
        .custom(customValidators_1.default.isNotEmptyAndString)
        .isLength({ max: 50 })
        .custom((slug) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const role = yield Role_1.Role.findOne({ slug: slug });
            if (role) {
                return Promise.reject(`Role with slug ${slug} already exists`);
            }
            return Promise.resolve();
        }
        catch (error) {
            return Promise.reject(error.message);
        }
    })),
];
