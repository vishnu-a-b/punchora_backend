import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";
import LocationDataController from "../controllers/LocationDataController";
import { locationDataListDoc } from "../docs/locationDataListDoc";
import { locationDataCreateDoc } from "../docs/locationDataCreateDoc";
import { createLocationDataValidator } from "../validators/createLocationDataValidator";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM, STAFF } = UserRole;

const router = express.Router();
const controller = new LocationDataController();

// Get last seen locations - Admins, control room, and dept heads
router.get(
  "/last-seen",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM]),
  applyBusinessScoping,
  locationDataListDoc,
  controller.getLastSeenLocations
);

// Get location tracking status - Admins and control room
router.get(
  "/tracking-status",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]),
  applyBusinessScoping,
  locationDataListDoc,
  controller.getLocationTrackingStatus
);

// Get mocked GPS summary - Admins and control room
router.get(
  "/mocked-summary",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]),
  applyBusinessScoping,
  locationDataListDoc,
  controller.getMockedGPSSummary
);

// Get mocked GPS locations - Admins and control room
router.get(
  "/mocked",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]),
  applyBusinessScoping,
  locationDataListDoc,
  controller.getMockedLocations
);

// Filter locations by date - Admins, control room, and dept heads
router.get(
  "/by-date",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM]),
  applyBusinessScoping,
  locationDataListDoc,
  controller.filterByDate
);

// Get all locations - Admins, control room, and dept heads
router.get(
  "/",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM]),
  applyBusinessScoping,
  locationDataListDoc,
  controller.list
);

// Create bulk locations - Staff submits own, admins can submit for anyone
router.post(
  "/bulk",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]),
  locationDataCreateDoc,
  controller.insertMany
);

// Create location - Staff submits own, admins can submit for anyone
router.post(
  "/",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]),
  locationDataCreateDoc,
  createLocationDataValidator,
  controller.create
);

export default router;
