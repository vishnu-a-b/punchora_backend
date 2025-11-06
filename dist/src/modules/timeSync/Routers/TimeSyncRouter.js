"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const TimeSyncController_1 = __importDefault(require("../controllers/TimeSyncController"));
const router = express_1.default.Router();
const controller = new TimeSyncController_1.default();
/**
 * GET /time-sync
 * Returns current server time for client synchronization
 * Used to prevent time manipulation attacks
 */
router.get("/", controller.getServerTime);
/**
 * POST /time-sync/validate
 * Validates a timestamp from client
 * Checks if timestamp is within acceptable range
 */
router.post("/validate", authenticateUser_1.authenticateUser, controller.validateTimestamp);
exports.default = router;
