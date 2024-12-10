import express from "express";
import { authenticateUser } from "../../../authentication/middlewares/authenticateUser";
import authorizeUser from "../../../../middlewares/authorizeUser";
import SpecialityController from "../controllers/SpecialityController";
import { specialityCreateValidator } from "../validators/specialityCreateValidator";
import { specialityListDoc } from "../docs/specialityListDoc";
import { specialityCreateDoc } from "../docs/specialityCreateDoc";
import { specialityDeleteDoc } from "../docs/specialityDeleteDoc";
const router = express.Router();
const controller = new SpecialityController();

router.use(authenticateUser);

router.get("/", specialityListDoc, controller.list);
router.post(
  "/",
  specialityCreateDoc,
  authorizeUser({ allowedRoles: [] }),
  specialityCreateValidator,
  controller.create
);
router.delete(
  "/:id",
  specialityDeleteDoc,
  authorizeUser({ allowedRoles: [] }),
  controller.delete
);

export default router;
