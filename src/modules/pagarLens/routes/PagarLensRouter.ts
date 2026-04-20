import { Router } from "express";
import PagarLensController from "../controllers/PagarLensController";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";
import { UserRole } from "../../../constants/roles";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF } = UserRole;
const router = Router();

// GET /v1/pagar-lens/descriptors — fetch staff embeddings for local recognition
router.get(
  "/descriptors",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]),
  applyBusinessScoping,
  PagarLensController.getDescriptors
);

// POST /v1/pagar-lens/attendance — sync attendance records from kiosk
router.post(
  "/attendance",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]),
  applyBusinessScoping,
  PagarLensController.syncAttendance
);

export default router;
