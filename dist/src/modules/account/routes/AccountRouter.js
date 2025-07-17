"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AccountDetailsController_1 = __importDefault(require("../controllers/AccountDetailsController"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const accountDetailsDoc_1 = require("../docs/accountDetailsDoc");
const router = express_1.default.Router();
const controller = new AccountDetailsController_1.default();
router.use(authenticateUser_1.authenticateUser);
router.get("/details", accountDetailsDoc_1.userDetailsDoc, controller.details);
exports.default = router;
