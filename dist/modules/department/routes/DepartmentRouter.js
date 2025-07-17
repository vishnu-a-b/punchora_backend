"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const authorizeUser_1 = __importDefault(require("../../../middlewares/authorizeUser"));
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
const router = express_1.default.Router();
const controller = new DepartmentController_1.default();
router.use(authenticateUser_1.authenticateUser);
const authorization = (0, authorizeUser_1.default)({
    allowedRoles: [],
});
router.get("/", departmentListDoc_1.departmentListDoc, (0, setFilterParams_1.default)(Department_1.departmentFilterFields), controller.get);
router.get("/count-documents", departmentCountDoc_1.departmentCountDoc, controller.countTotalDocuments);
router.get("/:id", departmentDetailsDoc_1.departmentDetailsDoc, controller.getOne);
router.post("/", authorization, departmentCreateDoc_1.departmentCreateDoc, departmentCreateValidator_1.departmentCreateValidator, controller.create);
router.put("/:id", authorization, departmentUpdateDoc_1.departmentUpdateDoc, departmentUpdateValidator_1.departmentUpdateValidator, controller.update);
router.delete("/:id", departmentDeleteDoc_1.departmentDeleteDoc, authorization, controller.delete);
router.get("/head/:id", departmentListofHeadDoc_1.departmentListofHeadDoc, authorization, controller.filterByHead);
exports.default = router;
