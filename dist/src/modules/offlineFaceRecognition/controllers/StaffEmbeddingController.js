"use strict";
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
exports.StaffEmbeddingController = void 0;
const StaffFaceEmbedding_1 = __importDefault(require("../models/StaffFaceEmbedding"));
const OnnxFaceService_1 = __importDefault(require("../services/OnnxFaceService"));
const StaffPhotoService_1 = __importDefault(require("../services/StaffPhotoService"));
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * StaffEmbeddingController
 * Handles staff photo uploads, embedding generation, and sync endpoints
 *
 * IMPORTANT: This is separate from existing face-api.js controllers
 */
class StaffEmbeddingController {
    constructor() {
        /**
         * POST /v1/offline-face/upload-staff-photo
         * Upload staff photo, generate ONNX embedding, save both
         */
        this.uploadStaffPhoto = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { staffId, photo } = req.body;
                // Validate input
                if (!staffId || !photo) {
                    return res.status(400).json({
                        success: false,
                        error: "staffId and photo (base64) are required",
                    });
                }
                // Validate staffId is valid MongoDB ObjectId
                if (!mongoose_1.default.Types.ObjectId.isValid(staffId)) {
                    return res.status(400).json({
                        success: false,
                        error: "Invalid staffId format",
                    });
                }
                // Save photo to local storage
                const photoPath = yield StaffPhotoService_1.default.savePhotoFromBase64(photo, staffId);
                // Generate embedding using ONNX
                const embedding = yield OnnxFaceService_1.default.generateEmbedding(photoPath);
                // Get photo URL
                const photoUrl = StaffPhotoService_1.default.getPhotoUrl(photoPath);
                // Check if embedding already exists for this staff
                const existingEmbedding = yield StaffFaceEmbedding_1.default.findOne({ staffId });
                if (existingEmbedding) {
                    // Update existing embedding
                    existingEmbedding.embedding = embedding;
                    existingEmbedding.photoUrl = photoUrl;
                    existingEmbedding.updatedAt = new Date();
                    yield existingEmbedding.save();
                    return res.status(200).json({
                        success: true,
                        message: "Staff face embedding updated successfully",
                        data: {
                            id: existingEmbedding._id,
                            staffId: existingEmbedding.staffId,
                            photoUrl: existingEmbedding.photoUrl,
                            embeddingDimensions: embedding.length,
                            updatedAt: existingEmbedding.updatedAt,
                        },
                    });
                }
                // Create new embedding record
                const newEmbedding = new StaffFaceEmbedding_1.default({
                    staffId: new mongoose_1.default.Types.ObjectId(staffId),
                    modelName: "MobileFaceNet",
                    embedding,
                    embeddingVersion: "v1.0",
                    photoUrl,
                });
                yield newEmbedding.save();
                res.status(201).json({
                    success: true,
                    message: "Staff face embedding created successfully",
                    data: {
                        id: newEmbedding._id,
                        staffId: newEmbedding.staffId,
                        photoUrl: newEmbedding.photoUrl,
                        embeddingDimensions: embedding.length,
                        createdAt: newEmbedding.createdAt,
                    },
                });
            }
            catch (error) {
                console.error("Error uploading staff photo:", error);
                next(error);
            }
        });
        /**
         * GET /v1/offline-face/staff-embeddings
         * Get all staff embeddings with pagination (for mobile sync)
         */
        this.getStaffEmbeddings = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 50;
                const lastSync = req.query.lastSync
                    ? new Date(req.query.lastSync)
                    : null;
                const skip = (page - 1) * limit;
                // Build query
                const query = {};
                if (lastSync) {
                    // Only get embeddings updated after lastSync
                    query.updatedAt = { $gt: lastSync };
                }
                // Get embeddings with pagination
                const embeddings = yield StaffFaceEmbedding_1.default.find(query)
                    .populate("staffId", "name uid") // Populate staff details (uid is the employee ID)
                    .sort({ updatedAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean();
                const total = yield StaffFaceEmbedding_1.default.countDocuments(query);
                // Transform response
                const data = embeddings.map((e) => {
                    var _a, _b, _c, _d, _e;
                    return ({
                        id: e._id.toString(),
                        staffId: ((_b = (_a = e.staffId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || "",
                        staffName: ((_c = e.staffId) === null || _c === void 0 ? void 0 : _c.name) || "Unknown",
                        employeeId: ((_e = (_d = e.staffId) === null || _d === void 0 ? void 0 : _d.uid) === null || _e === void 0 ? void 0 : _e.toString()) || "",
                        embedding: e.embedding,
                        photoUrl: e.photoUrl,
                        modelName: e.modelName,
                        embeddingVersion: e.embeddingVersion,
                        updatedAt: e.updatedAt.getTime(),
                    });
                });
                res.status(200).json({
                    success: true,
                    data,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasMore: page * limit < total,
                    },
                });
            }
            catch (error) {
                console.error("Error getting staff embeddings:", error);
                next(error);
            }
        });
        /**
         * GET /v1/offline-face/staff-list
         * Get minimal staff list (id, name, photo) for offline app
         */
        this.getStaffList = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const embeddings = yield StaffFaceEmbedding_1.default.find({})
                    .populate("staffId", "name uid")
                    .sort({ updatedAt: -1 })
                    .lean();
                const data = embeddings.map((e) => {
                    var _a, _b, _c, _d, _e;
                    return ({
                        staffId: ((_b = (_a = e.staffId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || "",
                        staffName: ((_c = e.staffId) === null || _c === void 0 ? void 0 : _c.name) || "Unknown",
                        employeeId: ((_e = (_d = e.staffId) === null || _d === void 0 ? void 0 : _d.uid) === null || _e === void 0 ? void 0 : _e.toString()) || "",
                        photoUrl: e.photoUrl,
                        updatedAt: e.updatedAt.getTime(),
                    });
                });
                res.status(200).json({
                    success: true,
                    data,
                    total: data.length,
                });
            }
            catch (error) {
                console.error("Error getting staff list:", error);
                next(error);
            }
        });
        /**
         * DELETE /v1/offline-face/staff-embedding/:staffId
         * Delete staff embedding
         */
        this.deleteStaffEmbedding = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { staffId } = req.params;
                if (!mongoose_1.default.Types.ObjectId.isValid(staffId)) {
                    return res.status(400).json({
                        success: false,
                        error: "Invalid staffId format",
                    });
                }
                const embedding = yield StaffFaceEmbedding_1.default.findOne({ staffId });
                if (!embedding) {
                    return res.status(404).json({
                        success: false,
                        error: "Staff embedding not found",
                    });
                }
                // Delete photo file
                try {
                    const photoPath = embedding.photoUrl.replace("/uploads/staff_face_photos/", "");
                    yield StaffPhotoService_1.default.deletePhoto(photoPath);
                }
                catch (error) {
                    console.warn("Failed to delete photo file:", error);
                }
                // Delete embedding
                yield embedding.deleteOne();
                res.status(200).json({
                    success: true,
                    message: "Staff embedding deleted successfully",
                });
            }
            catch (error) {
                console.error("Error deleting staff embedding:", error);
                next(error);
            }
        });
    }
}
exports.StaffEmbeddingController = StaffEmbeddingController;
exports.default = new StaffEmbeddingController();
