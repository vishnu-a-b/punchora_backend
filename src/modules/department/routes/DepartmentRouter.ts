import express, { Request, Response, NextFunction } from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { validateBusinessParam, applyBusinessScoping } from "../../../middlewares/businessScopingValidator";
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

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD } = UserRole;

const router = express.Router();
const controller = new DepartmentController();

router.use(authenticateUser);

// Get all departments - Admins and dept heads can view departments
router.get(
  "/",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]),
  applyBusinessScoping,
  departmentListDoc,
  setFilterParams(departmentFilterFields),
  controller.get
);

// Count departments - Super admin only
router.get(
  "/count-documents",
  checkRole([SUPER_ADMIN]),
  departmentCountDoc,
  controller.countTotalDocuments
);

// Get one department - Admins and dept heads can view
router.get(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]),
  applyBusinessScoping,
  departmentDetailsDoc,
  controller.getOne
);

// Create department - Super admin and business admin only
router.post(
  "/",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN]),
  applyBusinessScoping,
  departmentCreateDoc,
  departmentCreateValidator,
  controller.create
);
// Update department - Super admin and business admin only
router.put(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN]),
  applyBusinessScoping,
  departmentUpdateDoc,
  departmentUpdateValidator,
  controller.update
);

// Delete department - Super admin and business admin only
router.delete(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN]),
  applyBusinessScoping,
  departmentDeleteDoc,
  controller.delete
);
// Get departments by head - Admins and the dept head can view their assignments
router.get(
  "/head/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]),
  applyBusinessScoping,
  departmentListofHeadDoc,
  controller.filterByHead
);

export default router;
