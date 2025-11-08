import { Router } from "express";
import FaceDescriptorController from "../controllers/FaceDescriptorController";
import { authenticateUser } from "../../authentication/middleware/jwt";

const router = Router();

/**
 * @route   GET /v1/face-descriptors
 * @desc    Get all face descriptors for a business
 * @access  Private
 */
router.get(
  "/",
  authenticateUser,
  FaceDescriptorController.getAllDescriptors
);

/**
 * @route   POST /v1/face-descriptors
 * @desc    Create or update face descriptor
 * @access  Private
 */
router.post(
  "/",
  authenticateUser,
  FaceDescriptorController.upsertDescriptor
);

/**
 * @route   DELETE /v1/face-descriptors/:id
 * @desc    Delete face descriptor
 * @access  Private
 */
router.delete(
  "/:id",
  authenticateUser,
  FaceDescriptorController.deleteDescriptor
);

/**
 * @route   GET /v1/face-descriptors/count
 * @desc    Get face descriptor count
 * @access  Private
 */
router.get(
  "/count",
  authenticateUser,
  FaceDescriptorController.getDescriptorCount
);

export default router;
