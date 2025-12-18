"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const FailedLocationAttemptController_1 = __importDefault(require("../controllers/FailedLocationAttemptController"));
const router = express_1.default.Router();
const controller = new FailedLocationAttemptController_1.default();
router.get("/by-date", authenticateUser_1.authenticateUser, controller.filterByDate);
router.get("/", authenticateUser_1.authenticateUser, controller.list);
router.post("/bulk", authenticateUser_1.authenticateUser, controller.insertMany);
router.post("/", authenticateUser_1.authenticateUser, controller.create);
router.get("/:id", authenticateUser_1.authenticateUser, controller.getOne);
router.put("/:id", authenticateUser_1.authenticateUser, controller.update);
router.delete("/:id", authenticateUser_1.authenticateUser, controller.delete);
exports.default = router;
