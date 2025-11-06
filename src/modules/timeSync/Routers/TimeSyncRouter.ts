import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import TimeSyncController from "../controllers/TimeSyncController";

const router = express.Router();
const controller = new TimeSyncController();

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
router.post("/validate", authenticateUser, controller.validateTimestamp);

export default router;
