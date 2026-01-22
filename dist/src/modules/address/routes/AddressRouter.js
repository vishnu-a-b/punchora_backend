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
const AddressController_1 = __importDefault(require("../controllers/AddressController"));
const addressCreateValidator_1 = require("../validators/addressCreateValidator");
const setFilterParams_1 = __importDefault(require("../../../middlewares/setFilterParams"));
const Address_1 = require("../models/Address");
const addressCreateDoc_1 = require("../docs/addressCreateDoc");
const addressListDoc_1 = require("../docs/addressListDoc");
const addressDetailsDoc_1 = require("../docs/addressDetailsDoc");
const addressUpdateValidator_1 = require("../validators/addressUpdateValidator");
const addressUpdateDoc_1 = require("../docs/addressUpdateDoc");
const addressDeleteDoc_1 = require("../docs/addressDeleteDoc");
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN } = roles_1.UserRole;
const router = express_1.default.Router();
const controller = new AddressController_1.default();
// Get all addresses - Admin only
router.get("/", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, (0, setFilterParams_1.default)(Address_1.addressFilterFields), addressListDoc_1.addressListDoc, controller.list);
// Create address - Admin only
router.post("/", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, addressCreateValidator_1.addressCreateValidator, addressCreateDoc_1.addressCreateDoc, controller.create);
// Get one address - Admin only
router.get("/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, addressDetailsDoc_1.addressDetailsDoc, controller.getOne);
// Update address - Admin only
router.put("/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, addressUpdateValidator_1.addressUpdateValidator, addressUpdateDoc_1.addressUpdateDoc, controller.update);
// Delete address - Admin only
router.delete("/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, addressDeleteDoc_1.addressDeletesDoc, controller.delete);
exports.default = router;
