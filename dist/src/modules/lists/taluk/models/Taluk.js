"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Taluk = exports.talukFilterFields = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const talukSchema = new mongoose_1.default.Schema({
    name: { type: String, maxLength: 50, required: true },
    district: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "District" },
});
exports.talukFilterFields = {
    filterFields: ["name", "district"],
    searchFields: ["name"],
    sortFields: ["name"],
};
exports.Taluk = mongoose_1.default.model("Taluk", talukSchema);
