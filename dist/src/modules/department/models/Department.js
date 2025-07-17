"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Department = exports.departmentFilterFields = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const departmentSchema = new mongoose_1.default.Schema({
    name: { type: String, maxLength: 200, required: true },
    business: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Business" },
    head: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
exports.departmentFilterFields = {
    filterFields: ["business", "head"],
    searchFields: ["name"],
    sortFields: ["createdAt", "updatedAt"],
};
exports.Department = mongoose_1.default.model("Department", departmentSchema);
