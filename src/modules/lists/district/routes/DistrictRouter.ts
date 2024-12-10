import express from "express";
import { authenticateUser } from "../../../authentication/middlewares/authenticateUser";
import authorizeUser from "../../../../middlewares/authorizeUser";
import DistrictController from "../controllers/DistrictController";
import { districtCreateValidator } from "../validators/districtCreateValidator";
import setFilterParams from "../../../../middlewares/setFilterParams";
import { districtFilterFields } from "../models/District";
import { districtCreateDoc } from "../docs/districtCreateDoc";
import { districtListDoc } from "../docs/districtListDoc";
import { districtDeleteDoc } from "../docs/districtDeleteDoc";
const router = express.Router();
const controller = new DistrictController();

router.use(authenticateUser);

router.get(
  "/",
  districtListDoc,
  setFilterParams(districtFilterFields),
  controller.list
);
router.post(
  "/",
  districtCreateDoc,
  authorizeUser({ allowedRoles: [] }),
  districtCreateValidator,
  controller.create
);
router.delete(
  "/:id",
  districtDeleteDoc,
  authorizeUser({ allowedRoles: [] }),
  controller.delete
);

export default router;
