"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const FaceDescriptorController_1 = __importDefault(require("../controllers/FaceDescriptorController"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const router = (0, express_1.Router)();
/**
 * @route   GET /v1/face-descriptors
 * @desc    Get all face descriptors for a business
 * @access  Private
 */
router.get("/", FaceDescriptorController_1.default.getAllDescriptors);
/**
 * @route   POST /v1/face-descriptors
 * @desc    Create or update face descriptor
 * @access  Private
 */
router.post("/", authenticateUser_1.authenticateUser, FaceDescriptorController_1.default.upsertDescriptor);
/**
 * @route   DELETE /v1/face-descriptors/:id
 * @desc    Delete face descriptor
 * @access  Private
 */
router.delete("/:id", authenticateUser_1.authenticateUser, FaceDescriptorController_1.default.deleteDescriptor);
/**
 * @route   GET /v1/face-descriptors/count
 * @desc    Get face descriptor count
 * @access  Private
 */
router.get("/count", authenticateUser_1.authenticateUser, FaceDescriptorController_1.default.getDescriptorCount);
exports.default = router;
