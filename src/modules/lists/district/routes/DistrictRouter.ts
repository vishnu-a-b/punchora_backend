import express from "express";
import { authenticateUser } from "../../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../../middlewares/checkPermission";
import { UserRole } from "../../../../constants/roles";
import DistrictController from "../controllers/DistrictController";
import { districtCreateValidator } from "../validators/districtCreateValidator";
import setFilterParams from "../../../../middlewares/setFilterParams";
import { districtFilterFields } from "../models/District";
import { districtCreateDoc } from "../docs/districtCreateDoc";
import { districtListDoc } from "../docs/districtListDoc";
import { districtDeleteDoc } from "../docs/districtDeleteDoc";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF } = UserRole;

const router = express.Router();
const controller = new DistrictController();

router.use(authenticateUser);

// Get all districts - Everyone can view (reference data)
router.get(
  "/",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]),
  districtListDoc,
  setFilterParams(districtFilterFields),
  controller.list
);

// Create district - Super admin only (master data)
router.post(
  "/",
  checkRole([SUPER_ADMIN]),
  districtCreateDoc,
  districtCreateValidator,
  controller.create
);

// Delete district - Super admin only (master data)
router.delete(
  "/:id",
  checkRole([SUPER_ADMIN]),
  districtDeleteDoc,
  controller.delete
);

export default router;
