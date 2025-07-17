"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const authorizeUser_1 = __importDefault(require("../../../middlewares/authorizeUser"));
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
const roles_1 = __importDefault(require("../../base/enums/roles"));
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
const authorization = (0, authorizeUser_1.default)({
    allowedRoles: [],
});
router.get("/", businessListDoc_1.businessListDoc, (0, setFilterParams_1.default)(Business_1.businessFilterFields), controller.get);
router.get("/count-documents", businessCountDoc_1.businessCountDoc, controller.countTotalDocuments);
router.get("/:id", businessDetailsDoc_1.businessDetailsDoc, controller.getOne);
router.post("/", authorization, businessCreateDoc_1.businessCreateDoc, uploadMethod, businessCreateValidator_1.businessCreateValidator, controller.create);
router.put("/:id", authorization, businessUpdateDoc_1.businessUpdateDoc, uploadMethod, businessCreateValidator_1.businessCreateValidator, controller.update);
router.put("/vcLink/:id", authorization, vcLinkUpdateDoc_1.vcLinkUpdateDoc, controller.updateVcLink);
router.delete("/:id", businessDeleteDoc_1.businessDeleteDoc, authorization, controller.delete);
router.get("/admin/:id", businessListofAdminDoc_1.businessListofAdminDoc, (0, authorizeUser_1.default)({ allowedRoles: [roles_1.default.businessAdmin] }), controller.filterByAdmin);
exports.default = router;
