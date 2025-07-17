"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const AddressController_1 = __importDefault(require("../controllers/AddressController"));
const addressCreateValidator_1 = require("../validators/addressCreateValidator");
const authorizeUser_1 = __importDefault(require("../../../middlewares/authorizeUser"));
const setFilterParams_1 = __importDefault(require("../../../middlewares/setFilterParams"));
const Address_1 = require("../models/Address");
const addressCreateDoc_1 = require("../docs/addressCreateDoc");
const addressListDoc_1 = require("../docs/addressListDoc");
const addressDetailsDoc_1 = require("../docs/addressDetailsDoc");
const addressUpdateValidator_1 = require("../validators/addressUpdateValidator");
const addressUpdateDoc_1 = require("../docs/addressUpdateDoc");
const addressDeleteDoc_1 = require("../docs/addressDeleteDoc");
const router = express_1.default.Router();
const controller = new AddressController_1.default();
router.use(authenticateUser_1.authenticateUser);
router.get("/", (0, authorizeUser_1.default)({
    allowedRoles: [],
}), (0, setFilterParams_1.default)(Address_1.addressFilterFields), addressListDoc_1.addressListDoc, controller.list);
router.post("/", addressCreateValidator_1.addressCreateValidator, addressCreateDoc_1.addressCreateDoc, controller.create);
router.get("/:id", addressDetailsDoc_1.addressDetailsDoc, controller.getOne);
router.put("/:id", addressUpdateValidator_1.addressUpdateValidator, addressUpdateDoc_1.addressUpdateDoc, controller.update);
router.delete("/:id", addressDeleteDoc_1.addressDeletesDoc, controller.delete);
exports.default = router;
