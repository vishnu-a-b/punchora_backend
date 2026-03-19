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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaceDescriptorService = void 0;
const FaceDescriptor_1 = __importDefault(require("../models/FaceDescriptor"));
const mongoose_1 = __importDefault(require("mongoose"));
const facialRecognitionservice_1 = require("../../../services/facialRecognitionservice");
const fs = __importStar(require("fs"));
const RECOGNITION_THRESHOLD = 0.5; // euclidean distance (lower = stricter)
// Lazy singleton — only created on first face recognition request, not at startup
let _faceRecognitionService = null;
function getFaceRecognitionService() {
    if (!_faceRecognitionService) {
        _faceRecognitionService = new facialRecognitionservice_1.FaceRecognitionService();
    }
    return _faceRecognitionService;
}
class FaceDescriptorService {
    constructor() {
        /**
         * Get all face descriptors for a business
         */
        this.getAllDescriptors = (...args_1) => __awaiter(this, [...args_1], void 0, function* (
        // businessId: string,
        activeOnly = true) {
            const query = {};
            if (activeOnly) {
                query.isActive = true;
            }
            return yield FaceDescriptor_1.default.find(query)
                .sort({ updatedAt: -1 })
                .lean();
        });
        /**
         * Get face descriptors by staff ID
         */
        this.getDescriptorsByStaffId = (staffId_1, ...args_1) => __awaiter(this, [staffId_1, ...args_1], void 0, function* (staffId, activeOnly = true) {
            const query = { staffId };
            if (activeOnly) {
                query.isActive = true;
            }
            return yield FaceDescriptor_1.default.find(query)
                .sort({ createdAt: -1 })
                .lean();
        });
        /**
         * Create or update face descriptor
         */
        this.upsertDescriptor = (data) => __awaiter(this, void 0, void 0, function* () {
            // If ID provided, update existing
            if (data.id) {
                const existing = yield FaceDescriptor_1.default.findById(data.id);
                if (existing) {
                    existing.descriptor = data.descriptor;
                    existing.staffName = data.staffName;
                    if (data.photoUrl) {
                        existing.photoUrl = data.photoUrl;
                    }
                    yield existing.save();
                    return existing;
                }
            }
            // Create new descriptor
            const descriptor = new FaceDescriptor_1.default({
                _id: data.id || new mongoose_1.default.Types.ObjectId(),
                staffId: data.staffId,
                staffName: data.staffName,
                descriptor: data.descriptor,
                photoUrl: data.photoUrl,
                business: data.business,
                isActive: true,
            });
            yield descriptor.save();
            return descriptor;
        });
        /**
         * Deactivate face descriptor
         */
        this.deactivateDescriptor = (descriptorId) => __awaiter(this, void 0, void 0, function* () {
            yield FaceDescriptor_1.default.findByIdAndUpdate(descriptorId, {
                isActive: false,
            });
        });
        /**
         * Delete face descriptor
         */
        this.deleteDescriptor = (descriptorId) => __awaiter(this, void 0, void 0, function* () {
            yield FaceDescriptor_1.default.findByIdAndDelete(descriptorId);
        });
        /**
         * Get descriptors updated after a certain time
         */
        this.getDescriptorsUpdatedAfter = (businessId, afterTimestamp) => __awaiter(this, void 0, void 0, function* () {
            return yield FaceDescriptor_1.default.find({
                business: businessId,
                updatedAt: { $gte: afterTimestamp },
            })
                .sort({ updatedAt: -1 })
                .lean();
        });
        /**
         * Recognize a person from an uploaded photo using face-api.js.
         * Returns best match from FaceDescriptor collection.
         */
        this.recognizeFromPhoto = (imagePath, businessId) => __awaiter(this, void 0, void 0, function* () {
            try {
                // Extract descriptor from the uploaded photo
                const descriptor = yield getFaceRecognitionService().extractDescriptor(imagePath);
                // Fetch all active descriptors (optionally scoped to a business)
                const query = { isActive: true };
                if (businessId)
                    query.business = businessId;
                const records = yield FaceDescriptor_1.default.find(query).lean();
                if (records.length === 0) {
                    return null;
                }
                let bestMatch = null;
                for (const record of records) {
                    if (!record.descriptor || record.descriptor.length !== 128)
                        continue;
                    const storedDescriptor = new Float32Array(record.descriptor);
                    // Euclidean distance (same as faceapi.euclideanDistance)
                    let sum = 0;
                    for (let i = 0; i < 128; i++) {
                        const diff = descriptor[i] - storedDescriptor[i];
                        sum += diff * diff;
                    }
                    const distance = Math.sqrt(sum);
                    if (!bestMatch || distance < bestMatch.distance) {
                        bestMatch = {
                            staffId: record.staffId.toString(),
                            staffName: record.staffName,
                            distance,
                            photoUrl: record.photoUrl,
                        };
                    }
                }
                if (!bestMatch || bestMatch.distance > RECOGNITION_THRESHOLD) {
                    return null;
                }
                // Convert distance to confidence score (0-1, higher is better)
                const confidence = Math.max(0, 1 - bestMatch.distance / RECOGNITION_THRESHOLD);
                return {
                    staffId: bestMatch.staffId,
                    staffName: bestMatch.staffName,
                    confidence,
                    photoUrl: bestMatch.photoUrl,
                };
            }
            finally {
                // Clean up temp file
                try {
                    fs.unlinkSync(imagePath);
                }
                catch (_a) { }
            }
        });
        /**
         * Get descriptor count for a business
         */
        this.getDescriptorCount = (businessId_1, ...args_1) => __awaiter(this, [businessId_1, ...args_1], void 0, function* (businessId, activeOnly = true) {
            const query = { business: businessId };
            if (activeOnly) {
                query.isActive = true;
            }
            return yield FaceDescriptor_1.default.countDocuments(query);
        });
    }
}
exports.FaceDescriptorService = FaceDescriptorService;
exports.default = new FaceDescriptorService();
