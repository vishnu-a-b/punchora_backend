import { Router } from 'express';
import PerformanceController from '../controllers/PerformanceController';
import { authenticateUser } from '../../authentication/middlewares/authenticateUser';

const router = Router();

// All performance endpoints require authentication
router.use(authenticateUser);

/**
 * @route   GET /api/performance/health
 * @desc    Get health check with performance indicators
 * @access  Super Admin only
 */
router.get('/health', PerformanceController.getHealthCheck.bind(PerformanceController));

/**
 * @route   GET /api/performance/metrics
 * @desc    Get all performance metrics
 * @access  Super Admin only
 */
router.get('/metrics', PerformanceController.getMetrics.bind(PerformanceController));

/**
 * @route   GET /api/performance/queries
 * @desc    Get query performance metrics
 * @access  Super Admin only
 */
router.get('/queries', PerformanceController.getQueryMetrics.bind(PerformanceController));

/**
 * @route   GET /api/performance/requests
 * @desc    Get request performance metrics
 * @access  Super Admin only
 */
router.get('/requests', PerformanceController.getRequestMetrics.bind(PerformanceController));

/**
 * @route   GET /api/performance/memory
 * @desc    Get memory usage metrics
 * @access  Super Admin only
 */
router.get('/memory', PerformanceController.getMemoryMetrics.bind(PerformanceController));

/**
 * @route   GET /api/performance/cache
 * @desc    Get cache statistics
 * @access  Super Admin only
 */
router.get('/cache', PerformanceController.getCacheStats.bind(PerformanceController));

/**
 * @route   POST /api/performance/clear
 * @desc    Clear performance metrics
 * @access  Super Admin only
 */
router.post('/clear', PerformanceController.clearMetrics.bind(PerformanceController));

/**
 * @route   POST /api/performance/threshold
 * @desc    Set slow query threshold
 * @access  Super Admin only
 */
router.post('/threshold', PerformanceController.setSlowQueryThreshold.bind(PerformanceController));

/**
 * @route   POST /api/performance/cache/flush
 * @desc    Flush cache
 * @access  Super Admin only
 */
router.post('/cache/flush', PerformanceController.flushCache.bind(PerformanceController));

export default router;
