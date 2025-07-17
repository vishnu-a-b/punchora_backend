"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.District = exports.districtFilterFields = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const districtSchema = new mongoose_1.default.Schema({
    name: { type: String, maxLength: 50, required: true },
}, { timestamps: true });
exports.districtFilterFields = {
    filterFields: ["name"],
    searchFields: ["name"],
    sortFields: ["name"],
};
exports.District = mongoose_1.default.model("District", districtSchema);
