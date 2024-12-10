import express, { Request, Response, NextFunction } from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import authorizeUser from "../../../middlewares/authorizeUser";
import setFilterParams from "../../../middlewares/setFilterParams";
import { departmentListDoc } from "../docs/departmentListDoc";
import { departmentFilterFields } from "../models/Department";
import { departmentCountDoc } from "../docs/departmentCountDoc";
import { departmentDetailsDoc } from "../docs/departmentDetailsDoc";
import { departmentCreateDoc } from "../docs/departmentCreateDoc";
import { departmentCreateValidator } from "../validators/departmentCreateValidator";
import { departmentUpdateDoc } from "../docs/departmentUpdateDoc";
import { departmentUpdateValidator } from "../validators/departmentUpdateValidator";
import { departmentDeleteDoc } from "../docs/departmentDeleteDoc";
import { departmentListofHeadDoc } from "../docs/departmentListofHeadDoc";
import DepartmentController from "../controllers/DepartmentController";

const router = express.Router();
const controller = new DepartmentController();

router.use(authenticateUser);

const authorization = authorizeUser({
  allowedRoles: [],
});

router.get(
  "/",
  departmentListDoc,
  setFilterParams(departmentFilterFields),
  controller.get
);

router.get(
  "/count-documents",
  departmentCountDoc,
  controller.countTotalDocuments
);

router.get("/:id", departmentDetailsDoc, controller.getOne);

router.post(
  "/",
  authorization,
  departmentCreateDoc,
  departmentCreateValidator,
  controller.create
);
router.put(
  "/:id",
  authorization,
  departmentUpdateDoc,
  departmentUpdateValidator,
  controller.update
);

router.delete("/:id", departmentDeleteDoc, authorization, controller.delete);
router.get(
  "/head/:id",
  departmentListofHeadDoc,
  authorization,
  controller.filterByHead
);

export default router;
