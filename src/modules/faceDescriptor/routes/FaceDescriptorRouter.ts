import { Router } from "express";
import FaceDescriptorController from "../controllers/FaceDescriptorController";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM } = UserRole;

const router = Router();

/**
 * @route   GET /v1/face-descriptors
 * @desc    Get all face descriptors for a business
 * @access  Private - Business Admin, HR Admin, Super Admin, Control Room
 */
router.get(
  "/",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]),
  applyBusinessScoping,
  FaceDescriptorController.getAllDescriptors
);

/**
 * @route   POST /v1/face-descriptors
 * @desc    Create or update face descriptor
 * @access  Private - Business Admin, HR Admin, Super Admin only
 */
router.post(
  "/",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  FaceDescriptorController.upsertDescriptor
);

/**
 * @route   DELETE /v1/face-descriptors/:id
 * @desc    Delete face descriptor
 * @access  Private - Business Admin, HR Admin, Super Admin only
 */
router.delete(
  "/:id",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  FaceDescriptorController.deleteDescriptor
);

/**
 * @route   GET /v1/face-descriptors/count
 * @desc    Get face descriptor count
 * @access  Private - Business Admin, HR Admin, Super Admin, Control Room
 */
router.get(
  "/count",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]),
  applyBusinessScoping,
  FaceDescriptorController.getDescriptorCount
);

export default router;
