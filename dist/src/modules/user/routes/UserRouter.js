"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserController_1 = __importDefault(require("../controllers/UserController"));
const UserCreateValidator_1 = require("../validators/UserCreateValidator");
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../middlewares/checkPermission");
const roles_1 = require("../../../constants/roles");
const businessScopingValidator_1 = require("../../../middlewares/businessScopingValidator");
const multer_1 = __importDefault(require("multer"));
const multerConfig_1 = require("../../../multer/multerConfig");
const multerFileFilters_1 = require("../../../multer/multerFileFilters");
const BadRequestError_1 = __importDefault(require("../../../errors/errorTypes/BadRequestError"));
const setFilterParams_1 = __importDefault(require("../../../middlewares/setFilterParams"));
const User_1 = require("../models/User");
const userCreateDoc_1 = require("../docs/userCreateDoc");
const userListDoc_1 = require("../docs/userListDoc");
const userDetailsDoc_1 = require("../docs/userDetailsDoc");
const userUpdateDoc_1 = require("../docs/userUpdateDoc");
const UserUpdateValidator_1 = require("../validators/UserUpdateValidator");
const userDeleteDoc_1 = require("../docs/userDeleteDoc");
const updatePasswordDoc_1 = require("../docs/updatePasswordDoc");
const updatePasswordValidator_1 = require("../validators/updatePasswordValidator");
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN } = roles_1.UserRole;
const router = express_1.default.Router();
const controller = new UserController_1.default();
router.use(authenticateUser_1.authenticateUser);
const multiUpload = (0, multer_1.default)({
    storage: multerConfig_1.multerFileStorageForUserData,
    fileFilter: multerFileFilters_1.multerImageFilter,
}).fields([{ name: "photos" }, { name: "profilePicture", maxCount: 1 }]);
const uploadMethod = (req, res, next) => {
    return multiUpload(req, res, function (err) {
        if (err) {
            console.log("upload error", err);
            return next(new BadRequestError_1.default({ error: "invalid file type" }));
        }
        next();
    });
};
// Get all users - Admin only
router.get("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, (0, setFilterParams_1.default)(User_1.userFilterFields), userListDoc_1.userListDoc, controller.getList);
// Get users filtered by role - Admin only
router.get("/filter-by-role/:slug", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, (0, setFilterParams_1.default)(User_1.userFilterFields), userListDoc_1.userListDoc, controller.filterByRole);
// Create user - Admin only
router.post("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, uploadMethod, UserCreateValidator_1.userCreateValidator, userCreateDoc_1.userCreateDoc, controller.create);
// Get one user - Admin only
router.get("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, userDetailsDoc_1.userDetailsDoc, controller.getOne);
// Update user - Admin only
router.put("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, uploadMethod, userUpdateDoc_1.userUpdateDoc, UserUpdateValidator_1.userUpdateValidator, controller.update);
// Update password - User can update own password, admins can update any
router.put("/update-password/:id", updatePasswordDoc_1.updatePasswordDoc, updatePasswordValidator_1.updatePasswordValidator, controller.updatePassword);
// Delete user - Admin only
router.delete("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, userDeleteDoc_1.userDeleteDoc, controller.delete);
/**
 * @route PUT /users/:id/photos
 * @desc Update user photos and regenerate face descriptors
 * @access Admin only
 */
router.put("/:id/photos", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, uploadMethod, controller.updatePhotos);
/**
 * @route DELETE /users/:id/photos
 * @desc Delete user photos and face descriptors
 * @access Admin only
 */
router.delete("/:id/photos", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.deletePhotos);
exports.default = router;
