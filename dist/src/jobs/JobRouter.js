"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const JobController_1 = __importDefault(require("./JobController"));
const authenticateUser_1 = require("../modules/authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../middlewares/checkPermission");
const roles_1 = require("../constants/roles");
const { SUPER_ADMIN } = roles_1.UserRole;
const router = (0, express_1.Router)();
const controller = new JobController_1.default();
/**
 * @route   GET /v1/jobs/status
 * @desc    Get status of all scheduled jobs
 * @access  Private - Super Admin only
 */
router.get("/status", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.getJobStatus);
/**
 * @route   POST /v1/jobs/run/late-checkin
 * @desc    Manually trigger late check-in alert job
 * @access  Private - Super Admin only
 */
router.post("/run/late-checkin", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.runLateCheckinJob);
/**
 * @route   POST /v1/jobs/run/missing-checkout
 * @desc    Manually trigger missing checkout alert job
 * @access  Private - Super Admin only
 */
router.post("/run/missing-checkout", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.runMissingCheckoutJob);
/**
 * @route   POST /v1/jobs/run/expired-cleanup
 * @desc    Manually trigger expired alert cleanup
 * @access  Private - Super Admin only
 */
router.post("/run/expired-cleanup", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.runExpiredCleanup);
/**
 * @route   POST /v1/jobs/run/old-cleanup
 * @desc    Manually trigger old alert cleanup
 * @access  Private - Super Admin only
 */
router.post("/run/old-cleanup", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.runOldCleanup);
/**
 * @route   POST /v1/jobs/run/all
 * @desc    Manually trigger all daily jobs (for testing)
 * @access  Private - Super Admin only
 */
router.post("/run/all", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.runAllJobs);
exports.default = router;
