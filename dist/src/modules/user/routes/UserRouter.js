"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserController_1 = __importDefault(require("../controllers/UserController"));
const UserCreateValidator_1 = require("../validators/UserCreateValidator");
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const authorizeUser_1 = __importDefault(require("../../../middlewares/authorizeUser"));
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
const roles_1 = __importDefault(require("../../base/enums/roles"));
const updatePasswordDoc_1 = require("../docs/updatePasswordDoc");
const updatePasswordValidator_1 = require("../validators/updatePasswordValidator");
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
router.get("/", (0, setFilterParams_1.default)(User_1.userFilterFields), (0, authorizeUser_1.default)({ allowedRoles: [] }), userListDoc_1.userListDoc, controller.getList);
router.get("/filter-by-role/:slug", (0, setFilterParams_1.default)(User_1.userFilterFields), (0, authorizeUser_1.default)({ allowedRoles: [] }), userListDoc_1.userListDoc, controller.filterByRole);
router.post("/", uploadMethod, (0, authorizeUser_1.default)({ allowedRoles: [] }), UserCreateValidator_1.userCreateValidator, userCreateDoc_1.userCreateDoc, controller.create);
router.get("/:id", (0, authorizeUser_1.default)({ allowedRoles: [] }), userDetailsDoc_1.userDetailsDoc, controller.getOne);
router.put("/:id", (0, authorizeUser_1.default)({ allowedRoles: [] }), userUpdateDoc_1.userUpdateDoc, uploadMethod, UserUpdateValidator_1.userUpdateValidator, controller.update);
router.put("/update-password/:id", (0, authorizeUser_1.default)({ allowedRoles: [roles_1.default.staff] }), updatePasswordDoc_1.updatePasswordDoc, updatePasswordValidator_1.updatePasswordValidator, controller.updatePassword);
router.delete("/:id", authenticateUser_1.authenticateUser, userDeleteDoc_1.userDeleteDoc, (0, authorizeUser_1.default)({ allowedRoles: [] }), controller.delete);
exports.default = router;
