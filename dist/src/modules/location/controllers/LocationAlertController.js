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
const LocationAlertService_1 = __importDefault(require("../services/LocationAlertService"));
class LocationAlertController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.service = new LocationAlertService_1.default();
        // Get all alerts
        this.list = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { limit, skip, acknowledged, alertType, severity, businessId } = req.query;
                const data = yield this.service.list({
                    limit: limit ? Number(limit) : undefined,
                    skip: skip ? Number(skip) : undefined,
                    acknowledged: acknowledged === "true" ? true : acknowledged === "false" ? false : undefined,
                    alertType: alertType,
                    severity: severity,
                    businessId: businessId,
                });
                this.sendSuccessResponseList(res, 200, { data });
            }
            catch (e) {
                next(e);
            }
        });
        // Create alert
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const alert = yield this.service.create(req.body);
                this.sendSuccessResponse(res, 201, { data: alert });
            }
            catch (e) {
                next(e);
            }
        });
        // Acknowledge alert
        this.acknowledge = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // From auth middleware
                const alert = yield this.service.acknowledge(id, userId);
                this.sendSuccessResponse(res, 200, { data: alert });
            }
            catch (e) {
                next(e);
            }
        });
        // Resolve alert
        this.resolve = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const alert = yield this.service.resolve(id);
                this.sendSuccessResponse(res, 200, { data: alert });
            }
            catch (e) {
                next(e);
            }
        });
        // Generate alerts from failed attempts
        this.generateFromFailedAttempts = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const alerts = yield this.service.generateAlertsFromFailedAttempts();
                this.sendSuccessResponse(res, 201, { data: { alerts, count: alerts.length } });
            }
            catch (e) {
                next(e);
            }
        });
        // Generate alerts from mocked GPS
        this.generateFromMockedGPS = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const alerts = yield this.service.generateAlertsFromMockedGPS();
                this.sendSuccessResponse(res, 201, { data: { alerts, count: alerts.length } });
            }
            catch (e) {
                next(e);
            }
        });
        // Cleanup old alerts
        this.cleanup = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { daysOld } = req.query;
                const count = yield this.service.cleanupOldAlerts(daysOld ? Number(daysOld) : undefined);
                this.sendSuccessResponse(res, 200, { data: { deletedCount: count } });
            }
            catch (e) {
                next(e);
            }
        });
    }
}
exports.default = LocationAlertController;
