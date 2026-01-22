import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";
import AddressController from "../controllers/AddressController";
import { addressCreateValidator } from "../validators/addressCreateValidator";
import setFilterParams from "../../../middlewares/setFilterParams";
import { addressFilterFields } from "../models/Address";
import { addressCreateDoc } from "../docs/addressCreateDoc";
import { addressListDoc } from "../docs/addressListDoc";
import { addressDetailsDoc } from "../docs/addressDetailsDoc";
import { addressUpdateValidator } from "../validators/addressUpdateValidator";
import { addressUpdateDoc } from "../docs/addressUpdateDoc";
import { addressDeletesDoc } from "../docs/addressDeleteDoc";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN } = UserRole;

const router = express.Router();
const controller = new AddressController();

// Get all addresses - Admin only
router.get(
  "/",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  setFilterParams(addressFilterFields),
  addressListDoc,
  controller.list
);

// Create address - Admin only
router.post(
  "/",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  addressCreateValidator,
  addressCreateDoc,
  controller.create
);

// Get one address - Admin only
router.get(
  "/:id",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  addressDetailsDoc,
  controller.getOne
);

// Update address - Admin only
router.put(
  "/:id",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  addressUpdateValidator,
  addressUpdateDoc,
  controller.update
);

// Delete address - Admin only
router.delete(
  "/:id",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  addressDeletesDoc,
  controller.delete
);

export default router;
