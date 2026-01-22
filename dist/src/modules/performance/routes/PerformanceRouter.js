"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PerformanceController_1 = __importDefault(require("../controllers/PerformanceController"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const router = (0, express_1.Router)();
// All performance endpoints require authentication
router.use(authenticateUser_1.authenticateUser);
/**
 * @route   GET /api/performance/health
 * @desc    Get health check with performance indicators
 * @access  Super Admin only
 */
router.get('/health', PerformanceController_1.default.getHealthCheck.bind(PerformanceController_1.default));
/**
 * @route   GET /api/performance/metrics
 * @desc    Get all performance metrics
 * @access  Super Admin only
 */
router.get('/metrics', PerformanceController_1.default.getMetrics.bind(PerformanceController_1.default));
/**
 * @route   GET /api/performance/queries
 * @desc    Get query performance metrics
 * @access  Super Admin only
 */
router.get('/queries', PerformanceController_1.default.getQueryMetrics.bind(PerformanceController_1.default));
/**
 * @route   GET /api/performance/requests
 * @desc    Get request performance metrics
 * @access  Super Admin only
 */
router.get('/requests', PerformanceController_1.default.getRequestMetrics.bind(PerformanceController_1.default));
/**
 * @route   GET /api/performance/memory
 * @desc    Get memory usage metrics
 * @access  Super Admin only
 */
router.get('/memory', PerformanceController_1.default.getMemoryMetrics.bind(PerformanceController_1.default));
/**
 * @route   GET /api/performance/cache
 * @desc    Get cache statistics
 * @access  Super Admin only
 */
router.get('/cache', PerformanceController_1.default.getCacheStats.bind(PerformanceController_1.default));
/**
 * @route   POST /api/performance/clear
 * @desc    Clear performance metrics
 * @access  Super Admin only
 */
router.post('/clear', PerformanceController_1.default.clearMetrics.bind(PerformanceController_1.default));
/**
 * @route   POST /api/performance/threshold
 * @desc    Set slow query threshold
 * @access  Super Admin only
 */
router.post('/threshold', PerformanceController_1.default.setSlowQueryThreshold.bind(PerformanceController_1.default));
/**
 * @route   POST /api/performance/cache/flush
 * @desc    Flush cache
 * @access  Super Admin only
 */
router.post('/cache/flush', PerformanceController_1.default.flushCache.bind(PerformanceController_1.default));
exports.default = router;
