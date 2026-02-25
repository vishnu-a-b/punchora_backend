"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const FaceDescriptorController_1 = __importDefault(require("../controllers/FaceDescriptorController"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../middlewares/checkPermission");
const roles_1 = require("../../../constants/roles");
const businessScopingValidator_1 = require("../../../middlewares/businessScopingValidator");
const multerConfig_1 = require("../../../multer/multerConfig");
const recognitionUpload = (0, multer_1.default)({ storage: multerConfig_1.multerFileStorageForRecognition });
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM } = roles_1.UserRole;
const router = (0, express_1.Router)();
/**
 * @route   GET /v1/face-descriptors
 * @desc    Get all face descriptors for a business
 * @access  Private - Business Admin, HR Admin, Super Admin, Control Room
 */
router.get("/", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, FaceDescriptorController_1.default.getAllDescriptors);
/**
 * @route   POST /v1/face-descriptors
 * @desc    Create or update face descriptor
 * @access  Private - Business Admin, HR Admin, Super Admin only
 */
router.post("/", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, FaceDescriptorController_1.default.upsertDescriptor);
/**
 * @route   DELETE /v1/face-descriptors/:id
 * @desc    Delete face descriptor
 * @access  Private - Business Admin, HR Admin, Super Admin only
 */
router.delete("/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, FaceDescriptorController_1.default.deleteDescriptor);
/**
 * @route   GET /v1/face-descriptors/count
 * @desc    Get face descriptor count
 * @access  Private - Business Admin, HR Admin, Super Admin, Control Room
 */
router.get("/count", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, FaceDescriptorController_1.default.getDescriptorCount);
/**
 * @route   POST /v1/face-descriptors/recognize
 * @desc    Recognize a face from an uploaded photo using face-api.js
 * @access  Private - any authenticated user (kiosk device)
 */
router.post("/recognize", authenticateUser_1.authenticateUser, recognitionUpload.single("photo"), FaceDescriptorController_1.default.recognize);
exports.default = router;
