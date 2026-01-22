"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../../middlewares/checkPermission");
const roles_1 = require("../../../../constants/roles");
const talukCreateValidator_1 = require("../validators/talukCreateValidator");
const TalukController_1 = __importDefault(require("../controllers/TalukController"));
const Taluk_1 = require("../models/Taluk");
const setFilterParams_1 = __importDefault(require("../../../../middlewares/setFilterParams"));
const talukListDoc_1 = require("../docs/talukListDoc");
const talukCreateDoc_1 = require("../docs/talukCreateDoc");
const talukDeleteDoc_1 = require("../docs/talukDeleteDoc");
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF } = roles_1.UserRole;
const router = express_1.default.Router();
const controller = new TalukController_1.default();
router.use(authenticateUser_1.authenticateUser);
// Get all taluks - Everyone can view (reference data)
router.get("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]), talukListDoc_1.talukListDoc, (0, setFilterParams_1.default)(Taluk_1.talukFilterFields), controller.list);
// Create taluk - Super admin only (master data)
router.post("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN]), talukCreateDoc_1.talukCreateDoc, talukCreateValidator_1.talukCreateValidator, controller.create);
// Delete taluk - Super admin only (master data)
router.delete("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN]), talukDeleteDoc_1.talukDeleteDoc, controller.delete);
exports.default = router;
