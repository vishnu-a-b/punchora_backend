"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationData = exports.locationDataFilterFields = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const locationSchema = new mongoose_1.default.Schema({
    staff: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Staff" },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    date: {
        type: Date,
        required: true,
    },
}, { timestamps: true });
exports.locationDataFilterFields = {
    filterFields: ["staff"],
    searchFields: [],
    sortFields: ["createdAt", "updatedAt", "date"],
};
exports.LocationData = mongoose_1.default.model("LocationData", locationSchema);
