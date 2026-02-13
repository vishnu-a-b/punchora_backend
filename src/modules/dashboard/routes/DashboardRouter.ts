/**
 * Dashboard Routes
 * Analytics, bulk operations, custom reports, and layout customization
 * Phase 6: Admin Dashboard Enhancements
 */

import express from 'express';
import DashboardController from '../controllers/DashboardController';
import { authenticateUser } from '../../authentication/middlewares/authenticateUser';
import multer from 'multer';

const router = express.Router();
const controller = new DashboardController();

// Configure multer for CSV upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Apply authentication to all routes
router.use(authenticateUser);

/**
 * Analytics Endpoints
 */

// GET /api/dashboard/analytics - Get dashboard metrics
router.get(
  '/analytics',
  controller.getAnalytics.bind(controller)
);

// GET /api/dashboard/trends/:metric - Get trend data
router.get(
  '/trends/:metric',
  controller.getTrendData.bind(controller)
);

/**
 * Bulk Import/Export Endpoints
 */

// POST /api/dashboard/bulk/import/staff - Import staff from CSV
router.post(
  '/bulk/import/staff',
  upload.single('file'),
  controller.importStaff.bind(controller)
);

// GET /api/dashboard/bulk/import/template - Download CSV template
router.get(
  '/bulk/import/template',
  controller.getImportTemplate.bind(controller)
);

// GET /api/dashboard/bulk/export/staff - Export staff to CSV
router.get(
  '/bulk/export/staff',
  controller.exportStaff.bind(controller)
);

// GET /api/dashboard/bulk/export/attendance - Export attendance to CSV
router.get(
  '/bulk/export/attendance',
  controller.exportAttendance.bind(controller)
);

// GET /api/dashboard/bulk/export/alerts - Export alerts to CSV
router.get(
  '/bulk/export/alerts',
  controller.exportAlerts.bind(controller)
);

/**
 * Custom Report Endpoints
 */

// POST /api/dashboard/reports/custom - Build custom report
router.post(
  '/reports/custom',
  controller.buildCustomReport.bind(controller)
);

// POST /api/dashboard/reports/custom/export - Export custom report to CSV
router.post(
  '/reports/custom/export',
  controller.exportCustomReport.bind(controller)
);

// POST /api/dashboard/reports/save - Save report configuration
router.post(
  '/reports/save',
  controller.saveReportConfig.bind(controller)
);

// GET /api/dashboard/reports/saved - Get saved report configurations
router.get(
  '/reports/saved',
  controller.getSavedReports.bind(controller)
);

// GET /api/dashboard/reports/fields/:type - Get available fields for report type
router.get(
  '/reports/fields/:type',
  controller.getAvailableFields.bind(controller)
);

/**
 * Dashboard Customization Endpoints
 */

// GET /api/dashboard/layout - Get user's dashboard layout
router.get(
  '/layout',
  controller.getLayout.bind(controller)
);

// POST /api/dashboard/layout - Save dashboard layout
router.post(
  '/layout',
  controller.saveLayout.bind(controller)
);

// POST /api/dashboard/layout/reset - Reset layout to default
router.post(
  '/layout/reset',
  controller.resetLayout.bind(controller)
);

// GET /api/dashboard/widgets/available - Get available widget types
router.get(
  '/widgets/available',
  controller.getAvailableWidgets.bind(controller)
);

export default router;
