"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Token = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const tokenSchema = new mongoose_1.default.Schema({
    refreshToken: { type: String, required: true, maxLength: 200 },
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: () => Date.now() },
});
exports.Token = mongoose_1.default.model("Token", tokenSchema);
