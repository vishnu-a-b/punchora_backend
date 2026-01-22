import express from "express";
import { authenticateUser } from "../../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../../middlewares/checkPermission";
import { UserRole } from "../../../../constants/roles";
import { talukCreateValidator } from "../validators/talukCreateValidator";
import TalukController from "../controllers/TalukController";
import { talukFilterFields } from "../models/Taluk";
import setFilterParams from "../../../../middlewares/setFilterParams";
import { talukListDoc } from "../docs/talukListDoc";
import { talukCreateDoc } from "../docs/talukCreateDoc";
import { talukDeleteDoc } from "../docs/talukDeleteDoc";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF } = UserRole;

const router = express.Router();
const controller = new TalukController();

router.use(authenticateUser);

// Get all taluks - Everyone can view (reference data)
router.get(
  "/",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]),
  talukListDoc,
  setFilterParams(talukFilterFields),
  controller.list
);

// Create taluk - Super admin only (master data)
router.post(
  "/",
  checkRole([SUPER_ADMIN]),
  talukCreateDoc,
  talukCreateValidator,
  controller.create
);

// Delete taluk - Super admin only (master data)
router.delete(
  "/:id",
  checkRole([SUPER_ADMIN]),
  talukDeleteDoc,
  controller.delete
);

export default router;
