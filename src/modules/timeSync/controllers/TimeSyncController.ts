import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";

/**
 * Time Sync Controller
 * Provides server time to clients for secure timestamp validation
 * This prevents time manipulation attacks
 */
export default class TimeSyncController extends BaseController {
  /**
   * Get current server time
   * Used by mobile app to sync time and detect device time manipulation
   */
  getServerTime = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serverTime = new Date();

      // Also include timezone offset for reference
      const timezoneOffset = serverTime.getTimezoneOffset();

      this.sendSuccessResponse(res, 200, {
        data: {
          serverTime: serverTime.toISOString(),
          timestamp: serverTime.getTime(),
          timezoneOffset,
        },
      });
    } catch (e: any) {
      next(e);
    }
  };

  /**
   * Validate timestamp from client
   * Checks if the timestamp is within acceptable range
   * Used during attendance submission
   */
  validateTimestamp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { timestamp, metadata } = req.body;

      if (!timestamp) {
        return res.status(400).json({
          success: false,
          error: "Timestamp is required",
        });
      }

      const clientTime = new Date(timestamp);
      const serverTime = new Date();

      // Calculate time difference in seconds
      const timeDiff = Math.abs(serverTime.getTime() - clientTime.getTime()) / 1000;

      // Maximum allowed difference: 5 minutes (300 seconds)
      const maxDiff = 300;
      const isValid = timeDiff <= maxDiff;

      // Analyze metadata if provided
      let confidence = "medium";
      const warnings: string[] = [];

      if (metadata) {
        // Check if GPS time was used (high confidence)
        if (metadata.gpsTime) {
          confidence = "high";
        } else if (metadata.confidence === "low") {
          confidence = "low";
          warnings.push("Client used device time without GPS or time sync");
        }

        // Add client warnings
        if (metadata.warnings && Array.isArray(metadata.warnings)) {
          warnings.push(...metadata.warnings);
        }

        // Check device time vs secure time difference
        if (metadata.deviceTime && metadata.secureTime) {
          const deviceTime = new Date(metadata.deviceTime);
          const secureTime = new Date(metadata.secureTime);
          const clientDiff = Math.abs(deviceTime.getTime() - secureTime.getTime()) / 1000;

          if (clientDiff > 30) {
            warnings.push(
              `Client device time differs from secure time by ${clientDiff.toFixed(0)} seconds`
            );
            confidence = "low";
          }
        }
      }

      this.sendSuccessResponse(res, 200, {
        data: {
          valid: isValid,
          timeDifference: timeDiff,
          confidence,
          warnings,
          serverTime: serverTime.toISOString(),
          clientTime: clientTime.toISOString(),
        },
      });
    } catch (e: any) {
      next(e);
    }
  };
}
