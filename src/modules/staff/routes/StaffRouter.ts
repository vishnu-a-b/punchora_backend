import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import authorizeUser from "../../../middlewares/authorizeUser";
import setFilterParams from "../../../middlewares/setFilterParams";
import { staffListDoc } from "../docs/staffListDoc";
import { staffFilterFields } from "../models/Staff";
import { staffCountDoc } from "../docs/staffCountDoc";
import { staffDetailsDoc } from "../docs/staffDetailsDoc";
import { staffCreateDoc } from "../docs/staffCreateDoc";
import { staffCreateValidator } from "../validators/staffCreateValidator";
import { staffUpdateDoc } from "../docs/staffUpdateDoc";
import { staffUpdateValidator } from "../validators/staffUpdateValidator";
import StaffController from "../controllers/StaffController";
import { staffDeleteDoc } from "../docs/staffDeleteDoc";
import RolesEnum from "../../base/enums/roles";

const router = express.Router();
const controller = new StaffController();

router.use(authenticateUser);

const authorization = authorizeUser({ allowedRoles: [] });

router.get(
  "/",
  staffListDoc,
  setFilterParams(staffFilterFields),
  controller.get
);
router.get("/count-documents", staffCountDoc, controller.countTotalDocuments);
router.get("/get-attendance", staffListDoc, controller.getWithAttendance);
router.get("/user/:id", staffDetailsDoc, controller.getWithUserId);
router.get("/:id", staffDetailsDoc, controller.getOne);
router.post(
  "/",
  staffCreateDoc,
  authorization,
  staffCreateValidator,
  controller.create
);
router.put(
  "/:id",
  staffUpdateDoc,
  authorizeUser({ allowedRoles: [RolesEnum.staff] }),
  staffUpdateValidator,
  controller.update
);
router.delete("/:id", staffDeleteDoc, authorization, controller.delete);

export default router;
