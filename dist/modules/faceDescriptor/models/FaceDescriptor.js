"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaceDescriptor = exports.faceDescriptorFilterFields = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const faceDescriptorSchema = new mongoose_1.default.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    descriptor: [{ type: Number }],
}, { timestamps: true });
exports.faceDescriptorFilterFields = {
    filterFields: ["user", "staff"],
    searchFields: [],
    sortFields: [],
};
exports.FaceDescriptor = mongoose_1.default.model("FaceDescriptor", faceDescriptorSchema);
