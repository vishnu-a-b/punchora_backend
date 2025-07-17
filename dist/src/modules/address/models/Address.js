"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Address = exports.addressFilterFields = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const addressSchema = new mongoose_1.default.Schema({
    address: { type: String, maxLength: 200, required: true },
    taluk: { type: String, maxLength: 50, unique: false },
    district: { type: String, maxLength: 50, unique: false },
    pinCode: { type: String, maxLength: 10, unique: false, required: true },
    latitude: { type: Number, maxLength: 20, unique: false, required: false },
    longitude: { type: Number, maxLength: 20, unique: false, required: false },
}, { timestamps: true });
exports.addressFilterFields = {
    filterFields: ["taluk", "district", "pinCode", "latitude", "longitude"],
    searchFields: ["address", "taluk", "district", "pinCode"],
    sortFields: ["createdAt", "updatedAt"],
};
exports.Address = mongoose_1.default.model("Address", addressSchema);
