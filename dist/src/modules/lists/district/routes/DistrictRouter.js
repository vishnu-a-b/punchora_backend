"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../../middlewares/checkPermission");
const roles_1 = require("../../../../constants/roles");
const DistrictController_1 = __importDefault(require("../controllers/DistrictController"));
const districtCreateValidator_1 = require("../validators/districtCreateValidator");
const setFilterParams_1 = __importDefault(require("../../../../middlewares/setFilterParams"));
const District_1 = require("../models/District");
const districtCreateDoc_1 = require("../docs/districtCreateDoc");
const districtListDoc_1 = require("../docs/districtListDoc");
const districtDeleteDoc_1 = require("../docs/districtDeleteDoc");
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF } = roles_1.UserRole;
const router = express_1.default.Router();
const controller = new DistrictController_1.default();
router.use(authenticateUser_1.authenticateUser);
// Get all districts - Everyone can view (reference data)
router.get("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]), districtListDoc_1.districtListDoc, (0, setFilterParams_1.default)(District_1.districtFilterFields), controller.list);
// Create district - Super admin only (master data)
router.post("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN]), districtCreateDoc_1.districtCreateDoc, districtCreateValidator_1.districtCreateValidator, controller.create);
// Delete district - Super admin only (master data)
router.delete("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN]), districtDeleteDoc_1.districtDeleteDoc, controller.delete);
exports.default = router;
