import express from "express";
import { authenticateUser } from "../../../authentication/middlewares/authenticateUser";
import authorizeUser from "../../../../middlewares/authorizeUser";
import { talukCreateValidator } from "../validators/talukCreateValidator";
import TalukController from "../controllers/TalukController";
import { talukFilterFields } from "../models/Taluk";
import setFilterParams from "../../../../middlewares/setFilterParams";
import { talukListDoc } from "../docs/talukListDoc";
import { talukCreateDoc } from "../docs/talukCreateDoc";
import { talukDeleteDoc } from "../docs/talukDeleteDoc";
const router = express.Router();
const controller = new TalukController();

router.use(authenticateUser);

router.get(
  "/",
  talukListDoc,
  setFilterParams(talukFilterFields),
  controller.list
);
router.post(
  "/",
  talukCreateDoc,
  authorizeUser({ allowedRoles: [] }),
  talukCreateValidator,
  controller.create
);
router.delete(
  "/:id",
  talukDeleteDoc,
  authorizeUser({ allowedRoles: [] }),
  controller.delete
);

export default router;
