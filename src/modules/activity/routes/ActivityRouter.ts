import { Router } from "express";
import ActivityController from "../controllers/ActivityController";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";
import {
  startActivityValidator,
  endActivityValidator
} from "../validators/activityValidator";
import multer from "multer";
import { multerFileStorageForAttendance } from "../../../multer/multerConfig";
import { multerImageFilter } from "../../../multer/multerFileFilters";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF } = UserRole;

const router = Router();
const controller = new ActivityController();

// Setup multer for activity photo uploads
const uploadMiddleware = multer({
  storage: multerFileStorageForAttendance,
  fileFilter: multerImageFilter,
});

/**
 * @route   POST /activity/start
 * @desc    Start a new activity
 * @access  Private (Staff)
 */
router.post(
  "/start",
  authenticateUser,
  checkRole([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  uploadMiddleware.fields([
    { name: "photo", maxCount: 1 },
    { name: "vehiclePhoto", maxCount: 1 }
  ]),
  startActivityValidator,
  controller.startActivity
);

/**
 * @route   PUT /activity/:id/end
 * @desc    End an ongoing activity
 * @access  Private (Staff)
 */
router.put(
  "/:id/end",
  authenticateUser,
  checkRole([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  endActivityValidator,
  controller.endActivity
);

/**
 * @route   GET /activity/my-activities
 * @desc    Get my activities
 * @access  Private (Staff)
 */
router.get(
  "/my-activities",
  authenticateUser,
  checkRole([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]),
  controller.getMyActivities
);

/**
 * @route   GET /activity/ongoing
 * @desc    Get ongoing activities
 * @access  Private (Staff and Admins)
 */
router.get(
  "/ongoing",
  authenticateUser,
  checkRole([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]),
  controller.getOngoing
);

/**
 * @route   GET /activity/stats
 * @desc    Get activity statistics
 * @access  Private (Staff and Admins)
 */
router.get(
  "/stats",
  authenticateUser,
  checkRole([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]),
  controller.getStats
);

/**
 * @route   GET /activity/business
 * @desc    Get business activities (Admin)
 * @access  Private (Admin) - FIXED: Added authorization + business scoping
 */
router.get(
  "/business",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]),
  applyBusinessScoping,
  controller.getBusinessActivities
);

/**
 * @route   GET /activity/business-stats
 * @desc    Get business activity statistics (Admin)
 * @access  Private (Admin) - FIXED: Added authorization + business scoping
 */
router.get(
  "/business-stats",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]),
  applyBusinessScoping,
  controller.getBusinessStats
);

/**
 * @route   GET /activity/:id
 * @desc    Get activity by ID
 * @access  Private (Self or Admin)
 */
router.get(
  "/:id",
  authenticateUser,
  checkRole([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]),
  applyBusinessScoping,
  controller.getById
);

/**
 * @route   DELETE /activity/:id
 * @desc    Delete activity
 * @access  Private (Admin only)
 */
router.delete(
  "/:id",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.deleteActivity
);

export default router;
