"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const RoleController_1 = __importDefault(require("../controllers/RoleController"));
const roleCreateValidator_1 = require("../validators/roleCreateValidator");
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../middlewares/checkPermission");
const roles_1 = require("../../../constants/roles");
const roleListDoc_1 = require("../docs/roleListDoc");
const roleCreateDoc_1 = require("../docs/roleCreateDoc");
const Role_1 = require("../models/Role");
const setFilterParams_1 = __importDefault(require("../../../middlewares/setFilterParams"));
const roleDetailsDoc_1 = require("../docs/roleDetailsDoc");
const { SUPER_ADMIN } = roles_1.UserRole;
const router = express_1.default.Router();
const controller = new RoleController_1.default();
// NOTE: This entire router is for the LEGACY role system
// TODO: Remove this entire module in Phase 1 cleanup
router.use(authenticateUser_1.authenticateUser);
// Get all roles - Super admin only (legacy)
router.get("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN]), roleListDoc_1.roleListDoc, (0, setFilterParams_1.default)(Role_1.roleFilterFields), controller.get);
// Get role by slug - Super admin only (legacy)
router.get("/:slug", (0, checkPermission_1.checkRole)([SUPER_ADMIN]), roleDetailsDoc_1.roleFindBySlugDoc, controller.getOneBySlug);
// Create role - Super admin only (legacy)
router.post("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN]), roleCreateDoc_1.roleCreateDoc, roleCreateValidator_1.roleCreateValidator, controller.create);
exports.default = router;
