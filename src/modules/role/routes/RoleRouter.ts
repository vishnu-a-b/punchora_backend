import express from "express";
import RoleController from "../controllers/RoleController";
import { roleCreateValidator } from "../validators/roleCreateValidator";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { roleListDoc } from "../docs/roleListDoc";
import { roleCreateDoc } from "../docs/roleCreateDoc";
import { roleFilterFields } from "../models/Role";
import setFilterParams from "../../../middlewares/setFilterParams";
import { roleFindBySlugDoc } from "../docs/roleDetailsDoc";

const { SUPER_ADMIN } = UserRole;

const router = express.Router();
const controller = new RoleController();

// NOTE: This entire router is for the LEGACY role system
// TODO: Remove this entire module in Phase 1 cleanup
router.use(authenticateUser);

// Get all roles - Super admin only (legacy)
router.get(
  "/",
  checkRole([SUPER_ADMIN]),
  roleListDoc,
  setFilterParams(roleFilterFields),
  controller.get
);

// Get role by slug - Super admin only (legacy)
router.get(
  "/:slug",
  checkRole([SUPER_ADMIN]),
  roleFindBySlugDoc,
  controller.getOneBySlug
);

// Create role - Super admin only (legacy)
router.post(
  "/",
  checkRole([SUPER_ADMIN]),
  roleCreateDoc,
  roleCreateValidator,
  controller.create
);

export default router;
