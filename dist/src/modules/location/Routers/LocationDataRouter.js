"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const LocationDataController_1 = __importDefault(require("../controllers/LocationDataController"));
const locationDataListDoc_1 = require("../docs/locationDataListDoc");
const locationDataCreateDoc_1 = require("../docs/locationDataCreateDoc");
const createLocationDataValidator_1 = require("../validators/createLocationDataValidator");
const router = express_1.default.Router();
const controller = new LocationDataController_1.default();
router.get("/last-seen", authenticateUser_1.authenticateUser, locationDataListDoc_1.locationDataListDoc, controller.getLastSeenLocations);
router.get("/by-date", authenticateUser_1.authenticateUser, locationDataListDoc_1.locationDataListDoc, controller.filterByDate);
router.get("/", authenticateUser_1.authenticateUser, locationDataListDoc_1.locationDataListDoc, controller.list);
router.post("/bulk", authenticateUser_1.authenticateUser, locationDataCreateDoc_1.locationDataCreateDoc, controller.insertMany);
router.post("/", authenticateUser_1.authenticateUser, locationDataCreateDoc_1.locationDataCreateDoc, createLocationDataValidator_1.createLocationDataValidator, controller.create);
exports.default = router;
