import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";
import SalaryCalculationController from "../controllers/SalaryCalculationController";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN } = UserRole;

const router = express.Router();
const controller = new SalaryCalculationController();

router.use(authenticateUser);

// Preview (no save)
router.post(
  "/preview",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  controller.preview
);

// Create draft
router.post(
  "/",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  controller.create
);

// List calculations for a business
router.get(
  "/",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.list
);

// Get single calculation (full rows)
router.get(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  controller.getOne
);

// Patch overrides / custom columns
router.put(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  controller.update
);

// Recalculate (refresh computed values, preserve overrides)
router.put(
  "/:id/recalculate",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  controller.recalculate
);

// Finalize
router.put(
  "/:id/finalize",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  controller.finalize
);

// Delete (draft only)
router.delete(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  controller.remove
);

export default router;
