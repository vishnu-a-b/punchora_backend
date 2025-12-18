import { Router } from "express";
import ActivityController from "../controllers/ActivityController";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import {
  startActivityValidator,
  endActivityValidator
} from "../validators/activityValidator";
import multer from "multer";
import { multerFileStorageForAttendance } from "../../../multer/multerConfig";
import { multerImageFilter } from "../../../multer/multerFileFilters";

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
  endActivityValidator,
  controller.endActivity
);

/**
 * @route   GET /activity/my-activities
 * @desc    Get my activities
 * @access  Private (Staff)
 */
router.get("/my-activities", authenticateUser, controller.getMyActivities);

/**
 * @route   GET /activity/ongoing
 * @desc    Get ongoing activities
 * @access  Private (Staff)
 */
router.get("/ongoing", authenticateUser, controller.getOngoing);

/**
 * @route   GET /activity/stats
 * @desc    Get activity statistics
 * @access  Private (Staff)
 */
router.get("/stats", authenticateUser, controller.getStats);

/**
 * @route   GET /activity/business
 * @desc    Get business activities (Admin)
 * @access  Private (Admin)
 */
router.get("/business", authenticateUser, controller.getBusinessActivities);

/**
 * @route   GET /activity/business-stats
 * @desc    Get business activity statistics (Admin)
 * @access  Private (Admin)
 */
router.get("/business-stats", authenticateUser, controller.getBusinessStats);

/**
 * @route   GET /activity/:id
 * @desc    Get activity by ID
 * @access  Private
 */
router.get("/:id", authenticateUser, controller.getById);

/**
 * @route   DELETE /activity/:id
 * @desc    Delete activity
 * @access  Private
 */
router.delete("/:id", authenticateUser, controller.deleteActivity);

export default router;
