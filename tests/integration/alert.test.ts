/**
 * Integration Tests for Alert API
 * Tests the full HTTP request/response cycle for alert endpoints
 */

import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';
import { Alert, AlertStatus } from '../../src/modules/alert/models/Alert';
import AlertService from '../../src/modules/alert/services/AlertService';

describe('Alert API Integration', () => {
  setupTestDB();

  let app: express.Application;
  let businessId: string;
  let staffId: string;
  let userId: string;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req: any, res, next) => {
      req.user = {
        _id: userId,
        role: 'admin',
        businessId: businessId
      };
      next();
    });

    // Setup alert routes
    const alertRouter = Router();
    const alertService = new AlertService();

    // GET /api/alerts - List alerts
    alertRouter.get('/', async (req: any, res) => {
      try {
        const { business, staff, type, severity, status, limit = 10, skip = 0 } = req.query;

        const filter: any = {};
        if (business) filter.business = business;
        if (staff) filter.staff = staff;
        if (type) filter.type = type;
        if (severity) filter.severity = severity;
        if (status) filter.status = status;

        const result = await alertService.getAlerts(filter, {
          limit: parseInt(limit as string),
          skip: parseInt(skip as string)
        });

        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // POST /api/alerts - Create alert
    alertRouter.post('/', async (req, res) => {
      try {
        const alert = await alertService.createAlert(req.body);
        res.status(201).json(alert);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // POST /api/alerts/:id/acknowledge - Acknowledge alert
    alertRouter.post('/:id/acknowledge', async (req: any, res) => {
      try {
        const alert = await alertService.acknowledgeAlert(req.params.id, {
          userId: req.user._id,
          userName: 'Test User'
        });
        res.json(alert);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // POST /api/alerts/:id/resolve - Resolve alert
    alertRouter.post('/:id/resolve', async (req, res) => {
      try {
        const alert = await alertService.resolveAlert(req.params.id, req.body);
        res.json(alert);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // POST /api/alerts/:id/dismiss - Dismiss alert
    alertRouter.post('/:id/dismiss', async (req, res) => {
      try {
        const alert = await alertService.dismissAlert(req.params.id);
        res.json(alert);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // GET /api/alerts/stats - Get alert statistics
    alertRouter.get('/stats', async (req, res) => {
      try {
        const { business } = req.query;
        const stats = await alertService.getAlertStats(business as string);
        res.json(stats);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.use('/api/alerts', alertRouter);
  });

  beforeEach(async () => {
    businessId = mockObjectId().toString();
    staffId = mockObjectId().toString();
    userId = mockObjectId().toString();

    // Create test alerts
    await Alert.create([
      {
        type: 'mocked_gps',
        severity: 'high',
        staff: staffId,
        business: businessId,
        title: 'GPS Spoofing Detected',
        message: 'Mocked GPS location detected',
        status: AlertStatus.ACTIVE,
        priority: 5,
        acknowledged: false,
        resolved: false
      },
      {
        type: 'late_check_in',
        severity: 'medium',
        staff: staffId,
        business: businessId,
        title: 'Late Check-in',
        message: 'Staff checked in 30 minutes late',
        status: AlertStatus.ACTIVE,
        priority: 3,
        acknowledged: false,
        resolved: false
      }
    ]);
  });

  describe('GET /api/alerts', () => {
    it('should return alerts list with pagination', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .query({ limit: 10, skip: 0 })
        .expect(200);

      expect(response.body.alerts).toBeInstanceOf(Array);
      expect(response.body.alerts.length).toBeGreaterThan(0);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should filter alerts by business', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .query({ business: businessId })
        .expect(200);

      expect(response.body.alerts.length).toBeGreaterThan(0);
      expect(response.body.alerts.every((a: any) => a.business.toString() === businessId)).toBe(true);
    });

    it('should filter alerts by type', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .query({ type: 'mocked_gps' })
        .expect(200);

      expect(response.body.alerts.length).toBeGreaterThan(0);
      expect(response.body.alerts.every((a: any) => a.type === 'mocked_gps')).toBe(true);
    });

    it('should filter alerts by severity', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .query({ severity: 'high' })
        .expect(200);

      expect(response.body.alerts.length).toBeGreaterThan(0);
      expect(response.body.alerts.every((a: any) => a.severity === 'high')).toBe(true);
    });
  });

  describe('POST /api/alerts', () => {
    it('should create new alert', async () => {
      const newAlert = {
        type: 'missing_checkout',
        severity: 'medium',
        staff: staffId,
        business: businessId,
        title: 'Missing Checkout',
        message: 'Staff did not check out',
        priority: 4
      };

      const response = await request(app)
        .post('/api/alerts')
        .send(newAlert)
        .expect(201);

      expect(response.body._id).toBeTruthy();
      expect(response.body.type).toBe('missing_checkout');
      expect(response.body.status).toBe('active');
    });
  });

  describe('POST /api/alerts/:id/acknowledge', () => {
    it('should acknowledge an alert', async () => {
      const alert = await Alert.findOne({ type: 'mocked_gps' });

      const response = await request(app)
        .post(`/api/alerts/${alert!._id}/acknowledge`)
        .expect(200);

      expect(response.body.acknowledged).toBe(true);
      expect(response.body.status).toBe('acknowledged');
      expect(response.body.acknowledgedAt).toBeTruthy();
    });

    it('should return error if alert already acknowledged', async () => {
      const alert = await Alert.findOne({ type: 'mocked_gps' });

      // Acknowledge first time
      await request(app)
        .post(`/api/alerts/${alert!._id}/acknowledge`)
        .expect(200);

      // Try to acknowledge again
      await request(app)
        .post(`/api/alerts/${alert!._id}/acknowledge`)
        .expect(400);
    });
  });

  describe('POST /api/alerts/:id/resolve', () => {
    it('should resolve an alert', async () => {
      const alert = await Alert.findOne({ type: 'late_check_in' });

      const response = await request(app)
        .post(`/api/alerts/${alert!._id}/resolve`)
        .send({
          userId: userId,
          resolutionNotes: 'Issue resolved'
        })
        .expect(200);

      expect(response.body.resolved).toBe(true);
      expect(response.body.status).toBe('resolved');
      expect(response.body.resolutionNotes).toBe('Issue resolved');
    });
  });

  describe('POST /api/alerts/:id/dismiss', () => {
    it('should dismiss an alert', async () => {
      const alert = await Alert.findOne({ type: 'mocked_gps' });

      const response = await request(app)
        .post(`/api/alerts/${alert!._id}/dismiss`)
        .expect(200);

      expect(response.body.status).toBe('dismissed');
    });
  });

  describe('GET /api/alerts/stats', () => {
    it('should return alert statistics', async () => {
      const response = await request(app)
        .get('/api/alerts/stats')
        .expect(200);

      expect(response.body.overview).toBeDefined();
      expect(response.body.byType).toBeDefined();
      expect(response.body.bySeverity).toBeDefined();
      expect(response.body.byStatus).toBeDefined();
      expect(response.body.overview.total).toBeGreaterThan(0);
    });
  });
});
