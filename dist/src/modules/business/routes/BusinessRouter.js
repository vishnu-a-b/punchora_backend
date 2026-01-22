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
const multer_1 = __importDefault(require("multer"));
const multerConfig_1 = require("../../../multer/multerConfig");
const multerFileFilters_1 = require("../../../multer/multerFileFilters");
const BadRequestError_1 = __importDefault(require("../../../errors/errorTypes/BadRequestError"));
const setFilterParams_1 = __importDefault(require("../../../middlewares/setFilterParams"));
const vcLinkUpdateDoc_1 = require("../docs/vcLinkUpdateDoc");
const BusinessController_1 = __importDefault(require("../controllers/BusinessController"));
const businessListDoc_1 = require("../docs/businessListDoc");
const Business_1 = require("../models/Business");
const businessCountDoc_1 = require("../docs/businessCountDoc");
const businessDetailsDoc_1 = require("../docs/businessDetailsDoc");
const businessCreateDoc_1 = require("../docs/businessCreateDoc");
const businessCreateValidator_1 = require("../validators/businessCreateValidator");
const businessUpdateDoc_1 = require("../docs/businessUpdateDoc");
const businessDeleteDoc_1 = require("../docs/businessDeleteDoc");
const businessListofAdminDoc_1 = require("../docs/businessListofAdminDoc");
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN } = roles_1.UserRole;
const router = express_1.default.Router();
const controller = new BusinessController_1.default();
router.use(authenticateUser_1.authenticateUser);
const upload = (0, multer_1.default)({
    storage: multerConfig_1.multerFileStorage,
    fileFilter: multerFileFilters_1.multerImageFilter,
}).any();
const uploadMethod = (req, res, next) => {
    return upload(req, res, function (err) {
        if (err) {
            return next(new BadRequestError_1.default({ error: "invalid file type" }));
        }
        next();
    });
};
// Get all businesses - Super admin sees all, business admin sees only theirs
router.get("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, businessListDoc_1.businessListDoc, (0, setFilterParams_1.default)(Business_1.businessFilterFields), controller.get);
// Count businesses - Admin only
router.get("/count-documents", (0, checkPermission_1.checkRole)([SUPER_ADMIN]), businessCountDoc_1.businessCountDoc, controller.countTotalDocuments);
// Get one business - Admin can only access their own business
router.get("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.validateBusinessParam, businessDetailsDoc_1.businessDetailsDoc, controller.getOne);
// Create business - Super admin only
router.post("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN]), businessCreateDoc_1.businessCreateDoc, uploadMethod, businessCreateValidator_1.businessCreateValidator, controller.create);
// Update business - Super admin or business admin (only their own)
router.put("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN]), businessScopingValidator_1.validateBusinessParam, businessUpdateDoc_1.businessUpdateDoc, uploadMethod, businessCreateValidator_1.businessCreateValidator, controller.update);
// Update VC link - Admin only (business admin can update their own)
router.put("/vcLink/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN]), businessScopingValidator_1.validateBusinessParam, vcLinkUpdateDoc_1.vcLinkUpdateDoc, controller.updateVcLink);
// Delete business - Super admin only
router.delete("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN]), businessDeleteDoc_1.businessDeleteDoc, controller.delete);
// Get businesses by admin - Business admin gets their business
router.get("/admin/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN]), businessScopingValidator_1.validateBusinessParam, businessListofAdminDoc_1.businessListofAdminDoc, controller.filterByAdmin);
exports.default = router;
