import { Router } from "express";
import JobController from "./JobController";
import { authenticateUser } from "../modules/authentication/middlewares/authenticateUser";
import { checkRole } from "../middlewares/checkPermission";
import { UserRole } from "../constants/roles";

const { SUPER_ADMIN } = UserRole;

const router = Router();
const controller = new JobController();

/**
 * @route   GET /v1/jobs/status
 * @desc    Get status of all scheduled jobs
 * @access  Private - Super Admin only
 */
router.get(
  "/status",
  authenticateUser,
  checkRole([SUPER_ADMIN]),
  controller.getJobStatus
);

/**
 * @route   POST /v1/jobs/run/late-checkin
 * @desc    Manually trigger late check-in alert job
 * @access  Private - Super Admin only
 */
router.post(
  "/run/late-checkin",
  authenticateUser,
  checkRole([SUPER_ADMIN]),
  controller.runLateCheckinJob
);

/**
 * @route   POST /v1/jobs/run/missing-checkout
 * @desc    Manually trigger missing checkout alert job
 * @access  Private - Super Admin only
 */
router.post(
  "/run/missing-checkout",
  authenticateUser,
  checkRole([SUPER_ADMIN]),
  controller.runMissingCheckoutJob
);

/**
 * @route   POST /v1/jobs/run/expired-cleanup
 * @desc    Manually trigger expired alert cleanup
 * @access  Private - Super Admin only
 */
router.post(
  "/run/expired-cleanup",
  authenticateUser,
  checkRole([SUPER_ADMIN]),
  controller.runExpiredCleanup
);

/**
 * @route   POST /v1/jobs/run/old-cleanup
 * @desc    Manually trigger old alert cleanup
 * @access  Private - Super Admin only
 */
router.post(
  "/run/old-cleanup",
  authenticateUser,
  checkRole([SUPER_ADMIN]),
  controller.runOldCleanup
);

/**
 * @route   POST /v1/jobs/run/all
 * @desc    Manually trigger all daily jobs (for testing)
 * @access  Private - Super Admin only
 */
router.post(
  "/run/all",
  authenticateUser,
  checkRole([SUPER_ADMIN]),
  controller.runAllJobs
);

export default router;
