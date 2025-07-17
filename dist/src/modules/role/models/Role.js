"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = exports.roleFilterFields = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const roleSchema = new mongoose_1.default.Schema({
    title: { type: String, maxLength: 50, required: true },
    slug: { type: String, maxLength: 50, unique: true, required: true },
});
exports.roleFilterFields = {
    filterFields: ["slug"],
    searchFields: ["title", "slug"],
    sortFields: [],
};
exports.Role = mongoose_1.default.model("Role", roleSchema);
