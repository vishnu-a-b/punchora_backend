"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../middlewares/checkPermission");
const roles_1 = require("../../../constants/roles");
const businessScopingValidator_1 = require("../../../middlewares/businessScopingValidator");
const LocationDataController_1 = __importDefault(require("../controllers/LocationDataController"));
const locationDataListDoc_1 = require("../docs/locationDataListDoc");
const locationDataCreateDoc_1 = require("../docs/locationDataCreateDoc");
const createLocationDataValidator_1 = require("../validators/createLocationDataValidator");
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM, STAFF } = roles_1.UserRole;
const router = express_1.default.Router();
const controller = new LocationDataController_1.default();
// Get last seen locations - Admins, control room, and dept heads
router.get("/last-seen", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, locationDataListDoc_1.locationDataListDoc, controller.getLastSeenLocations);
// Get location tracking status - Admins and control room
router.get("/tracking-status", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, locationDataListDoc_1.locationDataListDoc, controller.getLocationTrackingStatus);
// Get mocked GPS summary - Admins and control room
router.get("/mocked-summary", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, locationDataListDoc_1.locationDataListDoc, controller.getMockedGPSSummary);
// Get mocked GPS locations - Admins and control room
router.get("/mocked", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, locationDataListDoc_1.locationDataListDoc, controller.getMockedLocations);
// Filter locations by date - Admins, control room, and dept heads
router.get("/by-date", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, locationDataListDoc_1.locationDataListDoc, controller.filterByDate);
// Get all locations - Admins, control room, and dept heads
router.get("/", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, locationDataListDoc_1.locationDataListDoc, controller.list);
// Create bulk locations - Staff submits own, admins can submit for anyone
router.post("/bulk", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]), locationDataCreateDoc_1.locationDataCreateDoc, controller.insertMany);
// Create location - Staff submits own, admins can submit for anyone
router.post("/", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]), locationDataCreateDoc_1.locationDataCreateDoc, createLocationDataValidator_1.createLocationDataValidator, controller.create);
exports.default = router;
