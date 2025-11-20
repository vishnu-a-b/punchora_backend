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
exports.StaffPhotoService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const sharp_1 = __importDefault(require("sharp"));
/**
 * StaffPhotoService
 * Handles staff photo uploads for ONNX-based face recognition
 *
 * IMPORTANT: Uses a separate folder from existing photo storage
 * Photos stored in: uploads/staff_face_photos/
 */
class StaffPhotoService {
    constructor() {
        // Use a different folder from existing photo storage
        this.uploadDir = path_1.default.join(process.cwd(), "uploads", "staff_face_photos");
        this.ensureUploadDirExists();
    }
    static getInstance() {
        if (!StaffPhotoService.instance) {
            StaffPhotoService.instance = new StaffPhotoService();
        }
        return StaffPhotoService.instance;
    }
    /**
     * Ensure upload directory exists
     */
    ensureUploadDirExists() {
        if (!fs_1.default.existsSync(this.uploadDir)) {
            fs_1.default.mkdirSync(this.uploadDir, { recursive: true });
            console.log(`✅ Created upload directory: ${this.uploadDir}`);
        }
    }
    /**
     * Save photo from base64 string
     * Returns local file path
     */
    savePhotoFromBase64(base64Data, staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Remove data URL prefix if present
                const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Image, "base64");
                // Generate unique filename
                const filename = `${staffId}_${(0, crypto_1.randomUUID)()}.jpg`;
                const filePath = path_1.default.join(this.uploadDir, filename);
                // Process and save image (resize, optimize)
                yield (0, sharp_1.default)(buffer)
                    .resize(800, 800, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
                    .jpeg({ quality: 90 })
                    .toFile(filePath);
                console.log(`✅ Saved staff photo: ${filename}`);
                return filePath;
            }
            catch (error) {
                console.error("Error saving photo from base64:", error);
                throw new Error("Failed to save staff photo");
            }
        });
    }
    /**
     * Save photo from file upload (multer)
     * Returns local file path
     */
    savePhotoFromUpload(file, staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Generate unique filename
                const filename = `${staffId}_${(0, crypto_1.randomUUID)()}.jpg`;
                const filePath = path_1.default.join(this.uploadDir, filename);
                // Process and save image (resize, optimize)
                yield (0, sharp_1.default)(file.buffer)
                    .resize(800, 800, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
                    .jpeg({ quality: 90 })
                    .toFile(filePath);
                console.log(`✅ Saved staff photo: ${filename}`);
                return filePath;
            }
            catch (error) {
                console.error("Error saving uploaded photo:", error);
                throw new Error("Failed to save staff photo");
            }
        });
    }
    /**
     * Delete photo file
     */
    deletePhoto(photoPath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (fs_1.default.existsSync(photoPath)) {
                    fs_1.default.unlinkSync(photoPath);
                    console.log(`✅ Deleted photo: ${photoPath}`);
                }
            }
            catch (error) {
                console.error("Error deleting photo:", error);
                throw new Error("Failed to delete staff photo");
            }
        });
    }
    /**
     * Get public URL for photo
     * (Adjust this based on your server configuration)
     */
    getPhotoUrl(photoPath) {
        // Return relative path or full URL based on your setup
        const filename = path_1.default.basename(photoPath);
        return `/uploads/staff_face_photos/${filename}`;
    }
    /**
     * Validate image file
     */
    validateImageFile(file) {
        const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new Error("Invalid file type. Only JPEG and PNG images are allowed.");
        }
        if (file.size > maxSize) {
            throw new Error("File size exceeds 10MB limit.");
        }
        return true;
    }
}
exports.StaffPhotoService = StaffPhotoService;
exports.default = StaffPhotoService.getInstance();
