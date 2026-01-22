"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ActivityController_1 = __importDefault(require("../controllers/ActivityController"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../middlewares/checkPermission");
const roles_1 = require("../../../constants/roles");
const businessScopingValidator_1 = require("../../../middlewares/businessScopingValidator");
const activityValidator_1 = require("../validators/activityValidator");
const multer_1 = __importDefault(require("multer"));
const multerConfig_1 = require("../../../multer/multerConfig");
const multerFileFilters_1 = require("../../../multer/multerFileFilters");
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF } = roles_1.UserRole;
const router = (0, express_1.Router)();
const controller = new ActivityController_1.default();
// Setup multer for activity photo uploads
const uploadMiddleware = (0, multer_1.default)({
    storage: multerConfig_1.multerFileStorageForAttendance,
    fileFilter: multerFileFilters_1.multerImageFilter,
});
/**
 * @route   POST /activity/start
 * @desc    Start a new activity
 * @access  Private (Staff)
 */
router.post("/start", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), uploadMiddleware.fields([
    { name: "photo", maxCount: 1 },
    { name: "vehiclePhoto", maxCount: 1 }
]), activityValidator_1.startActivityValidator, controller.startActivity);
/**
 * @route   PUT /activity/:id/end
 * @desc    End an ongoing activity
 * @access  Private (Staff)
 */
router.put("/:id/end", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), activityValidator_1.endActivityValidator, controller.endActivity);
/**
 * @route   GET /activity/my-activities
 * @desc    Get my activities
 * @access  Private (Staff)
 */
router.get("/my-activities", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), controller.getMyActivities);
/**
 * @route   GET /activity/ongoing
 * @desc    Get ongoing activities
 * @access  Private (Staff and Admins)
 */
router.get("/ongoing", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), controller.getOngoing);
/**
 * @route   GET /activity/stats
 * @desc    Get activity statistics
 * @access  Private (Staff and Admins)
 */
router.get("/stats", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), controller.getStats);
/**
 * @route   GET /activity/business
 * @desc    Get business activities (Admin)
 * @access  Private (Admin) - FIXED: Added authorization + business scoping
 */
router.get("/business", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), businessScopingValidator_1.applyBusinessScoping, controller.getBusinessActivities);
/**
 * @route   GET /activity/business-stats
 * @desc    Get business activity statistics (Admin)
 * @access  Private (Admin) - FIXED: Added authorization + business scoping
 */
router.get("/business-stats", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), businessScopingValidator_1.applyBusinessScoping, controller.getBusinessStats);
/**
 * @route   GET /activity/:id
 * @desc    Get activity by ID
 * @access  Private (Self or Admin)
 */
router.get("/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), businessScopingValidator_1.applyBusinessScoping, controller.getById);
/**
 * @route   DELETE /activity/:id
 * @desc    Delete activity
 * @access  Private (Admin only)
 */
router.delete("/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.deleteActivity);
exports.default = router;
