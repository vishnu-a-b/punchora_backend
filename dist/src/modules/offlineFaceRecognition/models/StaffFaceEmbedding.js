"use strict";
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
exports.StaffFaceEmbedding = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const StaffFaceEmbeddingSchema = new mongoose_1.Schema({
    staffId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Staff",
        required: true,
        index: true,
    },
    modelName: {
        type: String,
        required: true,
        default: "MobileFaceNet",
    },
    embedding: {
        type: [Number],
        required: true,
        validate: {
            validator: function (v) {
                // Support both MobileFaceNet (128-dim) and ArcFace (512-dim)
                return v.length === 128 || v.length === 512;
            },
            message: "Embedding must be either 128-dimensional (MobileFaceNet) or 512-dimensional (ArcFace)",
        },
    },
    embeddingVersion: {
        type: String,
        required: true,
        default: "v1.0",
    },
    photoUrl: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
// Index for efficient queries
StaffFaceEmbeddingSchema.index({ staffId: 1, updatedAt: -1 });
StaffFaceEmbeddingSchema.index({ updatedAt: -1 }); // For sync queries
const StaffFaceEmbedding = mongoose_1.default.model("StaffFaceEmbedding", StaffFaceEmbeddingSchema);
exports.StaffFaceEmbedding = StaffFaceEmbedding;
exports.default = StaffFaceEmbedding;
