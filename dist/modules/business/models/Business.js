"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Business = exports.businessFilterFields = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const managementTypes_1 = require("../../base/enums/managementTypes");
const businessSchema = new mongoose_1.default.Schema({
    name: { type: String, maxLength: 200, required: true },
    address: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Address" },
    photos: [{ type: String, maxLength: 200 }],
    managementType: {
        type: String,
        maxLength: 20,
        enum: Object.values(managementTypes_1.ManagementTypes),
    },
    contactMobileNumbers: [{ type: String, maxLength: 20, required: false }],
    contactLandlines: [{ type: String, maxLength: 20, required: false }],
    admin: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    vcLink: {
        type: String,
    },
}, { timestamps: true });
exports.businessFilterFields = {
    filterFields: ["admin", "managementType"],
    searchFields: ["name"],
    sortFields: ["createdAt", "updatedAt"],
};
exports.Business = mongoose_1.default.model("Business", businessSchema);
