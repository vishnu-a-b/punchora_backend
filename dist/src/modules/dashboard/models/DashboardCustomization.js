"use strict";
/**
 * Dashboard Customization Model
 * Stores user-specific dashboard widget configurations
 * Phase 6: Admin Dashboard Enhancements
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
exports.DashboardCustomization = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const DashboardCustomizationSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
        // unique: true automatically creates an index
    },
    role: {
        type: String,
        required: true
    },
    widgets: [
        {
            id: {
                type: String,
                required: true
            },
            type: {
                type: String,
                required: true,
                enum: ['metric', 'chart', 'table', 'alert-list']
            },
            title: {
                type: String,
                required: true
            },
            position: {
                x: { type: Number, required: true },
                y: { type: Number, required: true },
                w: { type: Number, required: true },
                h: { type: Number, required: true }
            },
            config: {
                type: mongoose_1.Schema.Types.Mixed,
                required: true
            },
            permissions: [String]
        }
    ]
}, {
    timestamps: true
});
// Indexes
// userId index is created automatically by unique: true
DashboardCustomizationSchema.index({ role: 1 });
exports.DashboardCustomization = mongoose_1.default.model('DashboardCustomization', DashboardCustomizationSchema);
