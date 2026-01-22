import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";
import FailedLocationAttemptController from "../controllers/FailedLocationAttemptController";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM, STAFF } = UserRole;

const router = express.Router();
const controller = new FailedLocationAttemptController();

// Get failed attempts by date - Admins, control room, and dept heads
router.get(
  "/by-date",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM]),
  applyBusinessScoping,
  controller.filterByDate
);

// Get staff with location disabled - Admins and control room
router.get(
  "/location-disabled",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]),
  applyBusinessScoping,
  controller.getStaffWithLocationDisabled
);

// Get location failure summary - Admins and control room
router.get(
  "/failure-summary",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]),
  applyBusinessScoping,
  controller.getLocationFailureSummary
);

// Get all failed attempts - Admins, control room, and dept heads
router.get(
  "/",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM]),
  applyBusinessScoping,
  controller.list
);

// Create bulk failed attempts - Staff reports own, admins can report for anyone
router.post(
  "/bulk",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]),
  controller.insertMany
);

// Create failed attempt - Staff reports own, admins can report for anyone
router.post(
  "/",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]),
  controller.create
);

// Get one failed attempt - Admins, control room, dept heads, and self
router.get(
  "/:id",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM, STAFF]),
  applyBusinessScoping,
  controller.getOne
);

// Update failed attempt - Admins only
router.put(
  "/:id",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.update
);

// Delete failed attempt - Admins only
router.delete(
  "/:id",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.delete
);

export default router;
