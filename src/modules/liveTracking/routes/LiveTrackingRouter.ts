import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import LiveTrackingController from "../controllers/LiveTrackingController";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM, STAFF } = UserRole;

const router = express.Router();
const controller = new LiveTrackingController();

// Admin: start a live tracking session for a staff member
router.post(
  "/start",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]),
  controller.startTracking
);

// Admin: stop live tracking
router.delete(
  "/stop/:staffId",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]),
  controller.stopTracking
);

// Admin: get all active sessions
router.get(
  "/sessions",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]),
  controller.getActiveSessions
);

// Mobile: check if this staff is being tracked (polled by mobile app)
router.get(
  "/active/:staffId",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM, STAFF]),
  controller.checkActive
);

// Mobile: send live location (no DB write — broadcast only)
router.post(
  "/location",
  authenticateUser,
  checkRole([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  controller.receiveLocation
);

export default router;
