"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseController_1 = __importDefault(require("../../base/controllers.ts/BaseController"));
/**
 * Time Sync Controller
 * Provides server time to clients for secure timestamp validation
 * This prevents time manipulation attacks
 */
class TimeSyncController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        /**
         * Get current server time
         * Used by mobile app to sync time and detect device time manipulation
         */
        this.getServerTime = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
            }
            catch (e) {
                next(e);
            }
        });
        /**
         * Validate timestamp from client
         * Checks if the timestamp is within acceptable range
         * Used during attendance submission
         */
        this.validateTimestamp = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
                const warnings = [];
                if (metadata) {
                    // Check if GPS time was used (high confidence)
                    if (metadata.gpsTime) {
                        confidence = "high";
                    }
                    else if (metadata.confidence === "low") {
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
                            warnings.push(`Client device time differs from secure time by ${clientDiff.toFixed(0)} seconds`);
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
            }
            catch (e) {
                next(e);
            }
        });
    }
}
exports.default = TimeSyncController;
