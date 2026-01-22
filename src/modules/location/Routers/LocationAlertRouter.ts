import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";
import LocationAlertController from "../controllers/LocationAlertController";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM } = UserRole;

const router = express.Router();
const controller = new LocationAlertController();

// Get all alerts - Business Admin, HR Admin, Control Room can view
router.get(
  "/",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]),
  applyBusinessScoping,
  controller.list
);

// Create alert - Admin only
router.post(
  "/",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.create
);

// Acknowledge alert - Admins and Control Room can acknowledge
router.post(
  "/:id/acknowledge",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]),
  applyBusinessScoping,
  controller.acknowledge
);

// Resolve alert - Admin only
router.post(
  "/:id/resolve",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.resolve
);

// Auto-generate alerts from failed attempts - Admin only
router.post(
  "/generate/failed-attempts",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.generateFromFailedAttempts
);

// Auto-generate alerts from mocked GPS - Admin only
router.post(
  "/generate/mocked-gps",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.generateFromMockedGPS
);

// Cleanup old alerts - Super Admin only
router.delete(
  "/cleanup",
  authenticateUser,
  checkRole([SUPER_ADMIN]),
  controller.cleanup
);

export default router;
