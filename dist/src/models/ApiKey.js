"use strict";
/**
 * API Key Model
 * For secure API access without user sessions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKey = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ApiKeySchema = new mongoose_1.Schema({
    key: {
        type: String,
        required: true,
        unique: true
        // Index created in composite index below (line 81)
    },
    name: {
        type: String,
        required: true,
        maxLength: 100
    },
    business: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
        // Index created in composite index below (line 82)
    },
    permissions: [
        {
            type: String,
            enum: [
                'read:staff',
                'write:staff',
                'read:attendance',
                'write:attendance',
                'read:reports',
                'read:alerts',
                'write:alerts',
                'read:activities',
                'write:activities',
                'admin:all'
            ]
        }
    ],
    active: {
        type: Boolean,
        default: true
        // Index created in composite indexes below
    },
    expiresAt: {
        type: Date
        // No standalone index needed
    },
    lastUsed: {
        type: Date
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});
// Index for efficient lookups
ApiKeySchema.index({ key: 1, active: 1 });
ApiKeySchema.index({ business: 1, active: 1 });
// Method to check if key is expired
ApiKeySchema.methods.isExpired = function () {
    if (!this.expiresAt)
        return false;
    return new Date() > this.expiresAt;
};
// Method to check if user has permission
ApiKeySchema.methods.hasPermission = function (permission) {
    return this.permissions.includes('admin:all') || this.permissions.includes(permission);
};
exports.ApiKey = mongoose_1.default.model('ApiKey', ApiKeySchema);
