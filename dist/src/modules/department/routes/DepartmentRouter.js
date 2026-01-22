"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../middlewares/checkPermission");
const roles_1 = require("../../../constants/roles");
const businessScopingValidator_1 = require("../../../middlewares/businessScopingValidator");
const setFilterParams_1 = __importDefault(require("../../../middlewares/setFilterParams"));
const departmentListDoc_1 = require("../docs/departmentListDoc");
const Department_1 = require("../models/Department");
const departmentCountDoc_1 = require("../docs/departmentCountDoc");
const departmentDetailsDoc_1 = require("../docs/departmentDetailsDoc");
const departmentCreateDoc_1 = require("../docs/departmentCreateDoc");
const departmentCreateValidator_1 = require("../validators/departmentCreateValidator");
const departmentUpdateDoc_1 = require("../docs/departmentUpdateDoc");
const departmentUpdateValidator_1 = require("../validators/departmentUpdateValidator");
const departmentDeleteDoc_1 = require("../docs/departmentDeleteDoc");
const departmentListofHeadDoc_1 = require("../docs/departmentListofHeadDoc");
const DepartmentController_1 = __importDefault(require("../controllers/DepartmentController"));
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD } = roles_1.UserRole;
const router = express_1.default.Router();
const controller = new DepartmentController_1.default();
router.use(authenticateUser_1.authenticateUser);
// Get all departments - Admins and dept heads can view departments
router.get("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), businessScopingValidator_1.applyBusinessScoping, departmentListDoc_1.departmentListDoc, (0, setFilterParams_1.default)(Department_1.departmentFilterFields), controller.get);
// Count departments - Super admin only
router.get("/count-documents", (0, checkPermission_1.checkRole)([SUPER_ADMIN]), departmentCountDoc_1.departmentCountDoc, controller.countTotalDocuments);
// Get one department - Admins and dept heads can view
router.get("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), businessScopingValidator_1.applyBusinessScoping, departmentDetailsDoc_1.departmentDetailsDoc, controller.getOne);
// Create department - Super admin and business admin only
router.post("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN]), businessScopingValidator_1.applyBusinessScoping, departmentCreateDoc_1.departmentCreateDoc, departmentCreateValidator_1.departmentCreateValidator, controller.create);
// Update department - Super admin and business admin only
router.put("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN]), businessScopingValidator_1.applyBusinessScoping, departmentUpdateDoc_1.departmentUpdateDoc, departmentUpdateValidator_1.departmentUpdateValidator, controller.update);
// Delete department - Super admin and business admin only
router.delete("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN]), businessScopingValidator_1.applyBusinessScoping, departmentDeleteDoc_1.departmentDeleteDoc, controller.delete);
// Get departments by head - Admins and the dept head can view their assignments
router.get("/head/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), businessScopingValidator_1.applyBusinessScoping, departmentListofHeadDoc_1.departmentListofHeadDoc, controller.filterByHead);
exports.default = router;
