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
const BaseController_1 = __importDefault(require("../modules/base/controllers.ts/BaseController"));
const AlertJobScheduler_1 = __importDefault(require("./AlertJobScheduler"));
/**
 * Job Controller
 *
 * Provides API endpoints for manually triggering scheduled jobs
 * and checking job status. Only accessible by Super Admin.
 */
class JobController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.scheduler = new AlertJobScheduler_1.default();
        /**
         * Get status of all scheduled jobs
         * GET /v1/jobs/status
         */
        this.getJobStatus = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const status = this.scheduler.getJobStatus();
                this.sendSuccessResponse(res, 200, {
                    message: "Job status retrieved successfully",
                    data: status,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Manually trigger late check-in alert job
         * POST /v1/jobs/run/late-checkin
         */
        this.runLateCheckinJob = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield this.scheduler.runLateCheckinJob();
                this.sendSuccessResponse(res, 200, {
                    message: "Late check-in job completed successfully",
                    data: {
                        alertsCreated: count,
                        timestamp: new Date(),
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Manually trigger missing checkout alert job
         * POST /v1/jobs/run/missing-checkout
         */
        this.runMissingCheckoutJob = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield this.scheduler.runMissingCheckoutJob();
                this.sendSuccessResponse(res, 200, {
                    message: "Missing checkout job completed successfully",
                    data: {
                        alertsCreated: count,
                        timestamp: new Date(),
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Manually trigger expired alert cleanup
         * POST /v1/jobs/run/expired-cleanup
         */
        this.runExpiredCleanup = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield this.scheduler.runExpiredAlertCleanup();
                this.sendSuccessResponse(res, 200, {
                    message: "Expired alert cleanup completed successfully",
                    data: {
                        alertsExpired: count,
                        timestamp: new Date(),
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Manually trigger old alert cleanup
         * POST /v1/jobs/run/old-cleanup
         */
        this.runOldCleanup = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield this.scheduler.runOldAlertCleanup();
                this.sendSuccessResponse(res, 200, {
                    message: "Old alert cleanup completed successfully",
                    data: {
                        alertsDeleted: count,
                        timestamp: new Date(),
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Run all daily jobs at once (for testing)
         * POST /v1/jobs/run/all
         */
        this.runAllJobs = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const results = yield this.scheduler.runAllDailyJobs();
                this.sendSuccessResponse(res, 200, {
                    message: "All daily jobs completed successfully",
                    data: Object.assign(Object.assign({}, results), { timestamp: new Date() }),
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Initialize scheduled jobs (called on server startup)
     * This method is not exposed as an API endpoint
     */
    initializeJobs() {
        this.scheduler.initializeJobs();
    }
}
exports.default = JobController;
