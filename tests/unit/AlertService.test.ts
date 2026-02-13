/**
 * Unit Tests for AlertService
 * Tests alert creation, retrieval, acknowledgement, resolution, and cleanup
 */

import AlertService from '../../src/modules/alert/services/AlertService';
import { Alert, AlertType, AlertSeverity, AlertStatus } from '../../src/modules/alert/models/Alert';
import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';

describe('AlertService', () => {
  setupTestDB();

  let alertService: AlertService;

  beforeEach(() => {
    alertService = new AlertService();
  });

  describe('createAlert', () => {
    it('should create a new alert with valid data', async () => {
      const alertData = {
        type: 'mocked_gps' as AlertType,
        severity: 'high' as AlertSeverity,
        staff: mockObjectId().toString(),
        business: mockObjectId().toString(),
        title: 'GPS Spoofing Detected',
        message: 'Mocked GPS location detected',
        priority: 5
      };

      const alert = await alertService.createAlert(alertData);

      expect(alert._id).toBeTruthy();
      expect(alert.type).toBe('mocked_gps');
      expect(alert.severity).toBe('high');
      expect(alert.status).toBe(AlertStatus.ACTIVE);
      expect(alert.acknowledged).toBe(false);
      expect(alert.resolved).toBe(false);
      expect(alert.priority).toBe(5);
    });

    it('should set default priority if not provided', async () => {
      const alertData = {
        type: 'late_check_in' as AlertType,
        severity: 'medium' as AlertSeverity,
        staff: mockObjectId().toString(),
        business: mockObjectId().toString(),
        title: 'Late Check-in',
        message: 'Staff checked in late'
      };

      const alert = await alertService.createAlert(alertData);

      expect(alert.priority).toBe(3);
    });

    it('should prevent duplicate alerts within 1 hour', async () => {
      const staffId = mockObjectId().toString();
      const businessId = mockObjectId().toString();

      const alertData = {
        type: 'mocked_gps' as AlertType,
        severity: 'high' as AlertSeverity,
        staff: staffId,
        business: businessId,
        title: 'GPS Spoofing',
        message: 'Mocked GPS detected'
      };

      const alert1 = await alertService.createAlert(alertData);
      const alert2 = await alertService.createAlert(alertData);

      expect((alert1 as any)._id.toString()).toBe((alert2 as any)._id.toString());
    });

    it('should update priority if duplicate alert has higher priority', async () => {
      const staffId = mockObjectId().toString();
      const businessId = mockObjectId().toString();

      await alertService.createAlert({
        type: 'mocked_gps' as AlertType,
        severity: 'high' as AlertSeverity,
        staff: staffId,
        business: businessId,
        title: 'GPS Spoofing',
        message: 'Mocked GPS detected',
        priority: 3
      });

      const alert2 = await alertService.createAlert({
        type: 'mocked_gps' as AlertType,
        severity: 'critical' as AlertSeverity,
        staff: staffId,
        business: businessId,
        title: 'GPS Spoofing',
        message: 'Mocked GPS detected',
        priority: 5
      });

      expect(alert2.priority).toBe(5);
    });
  });

  describe('getAlerts', () => {
    beforeEach(async () => {
      const businessId = mockObjectId();
      const staff1 = mockObjectId();
      const staff2 = mockObjectId();

      await Alert.create([
        {
          type: 'mocked_gps',
          severity: 'high',
          staff: staff1,
          business: businessId,
          title: 'GPS Spoofing 1',
          message: 'Alert 1',
          status: AlertStatus.ACTIVE,
          priority: 5,
          acknowledged: false,
          resolved: false
        },
        {
          type: 'late_check_in',
          severity: 'medium',
          staff: staff2,
          business: businessId,
          title: 'Late Check-in',
          message: 'Alert 2',
          status: AlertStatus.ACTIVE,
          priority: 3,
          acknowledged: false,
          resolved: false
        },
        {
          type: 'mocked_gps',
          severity: 'high',
          staff: staff1,
          business: businessId,
          title: 'GPS Spoofing 2',
          message: 'Alert 3',
          status: AlertStatus.RESOLVED,
          priority: 5,
          acknowledged: true,
          resolved: true
        }
      ]);
    });

    it('should return all alerts with pagination', async () => {
      const result = await alertService.getAlerts({}, { limit: 10, skip: 0 });

      expect(result.alerts).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should filter by business', async () => {
      const businessId = (await Alert.findOne())!.business.toString();

      const result = await alertService.getAlerts({ business: businessId });

      expect(result.alerts.length).toBeGreaterThan(0);
      expect(result.alerts.every(a => a.business.toString() === businessId)).toBe(true);
    });

    it('should filter by type', async () => {
      const result = await alertService.getAlerts({ type: 'mocked_gps' as AlertType });

      expect(result.alerts).toHaveLength(2);
      expect(result.alerts.every(a => a.type === 'mocked_gps')).toBe(true);
    });

    it('should filter by severity', async () => {
      const result = await alertService.getAlerts({ severity: 'high' as AlertSeverity });

      expect(result.alerts).toHaveLength(2);
      expect(result.alerts.every(a => a.severity === 'high')).toBe(true);
    });

    it('should filter by status', async () => {
      const result = await alertService.getAlerts({ status: AlertStatus.ACTIVE });

      expect(result.alerts).toHaveLength(2);
      expect(result.alerts.every(a => a.status === 'active')).toBe(true);
    });

    it('should filter by acknowledged status', async () => {
      const result = await alertService.getAlerts({ acknowledged: false });

      expect(result.alerts.every(a => a.acknowledged === false)).toBe(true);
    });

    it('should filter by resolved status', async () => {
      const result = await alertService.getAlerts({ resolved: true });

      expect(result.alerts.every(a => a.resolved === true)).toBe(true);
    });

    it('should sort by priority descending by default', async () => {
      const result = await alertService.getAlerts({});

      expect(result.alerts[0].priority).toBeGreaterThanOrEqual(result.alerts[1].priority);
    });

    it('should handle pagination', async () => {
      const page1 = await alertService.getAlerts({}, { limit: 2, skip: 0 });
      const page2 = await alertService.getAlerts({}, { limit: 2, skip: 2 });

      expect(page1.alerts).toHaveLength(2);
      expect(page2.alerts).toHaveLength(1);
    });
  });

  describe('getActiveAlerts', () => {
    beforeEach(async () => {
      const businessId = mockObjectId();

      await Alert.create([
        {
          type: 'mocked_gps',
          severity: 'high',
          staff: mockObjectId(),
          business: businessId,
          title: 'Active Alert 1',
          message: 'Alert 1',
          status: AlertStatus.ACTIVE,
          priority: 5
        },
        {
          type: 'late_check_in',
          severity: 'medium',
          staff: mockObjectId(),
          business: businessId,
          title: 'Active Alert 2',
          message: 'Alert 2',
          status: AlertStatus.ACTIVE,
          priority: 3
        },
        {
          type: 'mocked_gps',
          severity: 'high',
          staff: mockObjectId(),
          business: businessId,
          title: 'Resolved Alert',
          message: 'Alert 3',
          status: AlertStatus.RESOLVED,
          priority: 5
        }
      ]);
    });

    it('should return only active alerts', async () => {
      const alerts = await alertService.getActiveAlerts();

      expect(alerts).toHaveLength(2);
      expect(alerts.every(a => a.status === 'active')).toBe(true);
    });

    it('should filter active alerts by business', async () => {
      const businessId = (await Alert.findOne())!.business.toString();

      const alerts = await alertService.getActiveAlerts(businessId);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.every(a => a.business.toString() === businessId)).toBe(true);
    });
  });

  describe('getAlertById', () => {
    it('should return alert by ID', async () => {
      const alert = await Alert.create({
        type: 'mocked_gps',
        severity: 'high',
        staff: mockObjectId(),
        business: mockObjectId(),
        title: 'Test Alert',
        message: 'Test message',
        status: AlertStatus.ACTIVE,
        priority: 3
      });

      const found = await alertService.getAlertById((alert as any)._id.toString());

      expect(found).toBeTruthy();
      expect(found!._id.toString()).toBe((alert as any)._id.toString());
    });

    it('should return null for non-existent ID', async () => {
      const fakeId = mockObjectId().toString();

      const found = await alertService.getAlertById(fakeId);

      expect(found).toBeNull();
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', async () => {
      const alert = await Alert.create({
        type: 'mocked_gps',
        severity: 'high',
        staff: mockObjectId(),
        business: mockObjectId(),
        title: 'Test Alert',
        message: 'Test',
        status: AlertStatus.ACTIVE,
        acknowledged: false
      });

      const acknowledged = await alertService.acknowledgeAlert(
        (alert as any)._id.toString(),
        { userId: mockObjectId().toString(), userName: 'Admin User' }
      );

      expect(acknowledged!.acknowledged).toBe(true);
      expect(acknowledged!.status).toBe(AlertStatus.ACKNOWLEDGED);
      expect(acknowledged!.acknowledgedAt).toBeTruthy();
      expect(acknowledged!.acknowledgedByName).toBe('Admin User');
    });

    it('should throw error if alert not found', async () => {
      const fakeId = mockObjectId().toString();

      await expect(
        alertService.acknowledgeAlert(fakeId, { userId: mockObjectId().toString(), userName: 'Admin' })
      ).rejects.toThrow('Alert not found');
    });

    it('should throw error if already acknowledged', async () => {
      const alert = await Alert.create({
        type: 'mocked_gps',
        severity: 'high',
        staff: mockObjectId(),
        business: mockObjectId(),
        title: 'Test Alert',
        message: 'Test',
        status: AlertStatus.ACKNOWLEDGED,
        acknowledged: true,
        acknowledgedAt: new Date()
      });

      await expect(
        alertService.acknowledgeAlert((alert as any)._id.toString(), { userId: mockObjectId().toString(), userName: 'Admin' })
      ).rejects.toThrow('Alert already acknowledged');
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an alert', async () => {
      const alert = await Alert.create({
        type: 'mocked_gps',
        severity: 'high',
        staff: mockObjectId(),
        business: mockObjectId(),
        title: 'Test Alert',
        message: 'Test',
        status: AlertStatus.ACTIVE,
        resolved: false
      });

      const resolved = await alertService.resolveAlert(
        (alert as any)._id.toString(),
        { userId: mockObjectId().toString(), resolutionNotes: 'Issue fixed' }
      );

      expect(resolved!.resolved).toBe(true);
      expect(resolved!.status).toBe(AlertStatus.RESOLVED);
      expect(resolved!.resolvedAt).toBeTruthy();
      expect(resolved!.resolutionNotes).toBe('Issue fixed');
    });

    it('should throw error if alert not found', async () => {
      const fakeId = mockObjectId().toString();

      await expect(
        alertService.resolveAlert(fakeId, { userId: mockObjectId().toString() })
      ).rejects.toThrow('Alert not found');
    });

    it('should throw error if already resolved', async () => {
      const alert = await Alert.create({
        type: 'mocked_gps',
        severity: 'high',
        staff: mockObjectId(),
        business: mockObjectId(),
        title: 'Test Alert',
        message: 'Test',
        status: AlertStatus.RESOLVED,
        resolved: true,
        resolvedAt: new Date()
      });

      await expect(
        alertService.resolveAlert((alert as any)._id.toString(), { userId: mockObjectId().toString() })
      ).rejects.toThrow('Alert already resolved');
    });
  });

  describe('dismissAlert', () => {
    it('should dismiss an alert', async () => {
      const alert = await Alert.create({
        type: 'mocked_gps',
        severity: 'high',
        staff: mockObjectId(),
        business: mockObjectId(),
        title: 'Test Alert',
        message: 'Test',
        status: AlertStatus.ACTIVE
      });

      const dismissed = await alertService.dismissAlert((alert as any)._id.toString());

      expect(dismissed!.status).toBe(AlertStatus.DISMISSED);
    });

    it('should throw error if alert not found', async () => {
      const fakeId = mockObjectId().toString();

      await expect(
        alertService.dismissAlert(fakeId)
      ).rejects.toThrow('Alert not found');
    });
  });

  describe('getAlertStats', () => {
    beforeEach(async () => {
      const businessId = mockObjectId();

      await Alert.create([
        {
          type: 'mocked_gps',
          severity: 'high',
          staff: mockObjectId(),
          business: businessId,
          title: 'Alert 1',
          message: 'Test',
          status: AlertStatus.ACTIVE,
          acknowledged: false,
          resolved: false,
          priority: 5
        },
        {
          type: 'mocked_gps',
          severity: 'high',
          staff: mockObjectId(),
          business: businessId,
          title: 'Alert 2',
          message: 'Test',
          status: AlertStatus.ACKNOWLEDGED,
          acknowledged: true,
          resolved: false,
          priority: 4
        },
        {
          type: 'late_check_in',
          severity: 'medium',
          staff: mockObjectId(),
          business: businessId,
          title: 'Alert 3',
          message: 'Test',
          status: AlertStatus.RESOLVED,
          acknowledged: true,
          resolved: true,
          priority: 3
        }
      ]);
    });

    it('should return alert statistics', async () => {
      const stats = await alertService.getAlertStats();

      expect(stats.overview.total).toBe(3);
      expect(stats.overview.active).toBeGreaterThan(0);
      expect(stats.overview.acknowledged).toBeGreaterThan(0);
      expect(stats.overview.resolved).toBeGreaterThan(0);
      expect(stats.byType).toBeDefined();
      expect(stats.bySeverity).toBeDefined();
      expect(stats.byStatus).toBeDefined();
    });

    it('should filter stats by business', async () => {
      const businessId = (await Alert.findOne())!.business.toString();

      const stats = await alertService.getAlertStats(businessId);

      expect(stats.overview.total).toBe(3);
    });
  });

  describe('expireOldAlerts', () => {
    it('should expire old unacknowledged active alerts', async () => {
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

      await Alert.create({
        type: 'mocked_gps',
        severity: 'high',
        staff: mockObjectId(),
        business: mockObjectId(),
        title: 'Old Alert',
        message: 'Test',
        status: AlertStatus.ACTIVE,
        acknowledged: false,
        createdAt: oldDate
      });

      const count = await alertService.expireOldAlerts(24);

      expect(count).toBe(1);

      const alert = await Alert.findOne({ title: 'Old Alert' });
      expect(alert!.status).toBe(AlertStatus.DISMISSED);
    });

    it('should not expire recent alerts', async () => {
      await Alert.create({
        type: 'mocked_gps',
        severity: 'high',
        staff: mockObjectId(),
        business: mockObjectId(),
        title: 'Recent Alert',
        message: 'Test',
        status: AlertStatus.ACTIVE,
        acknowledged: false
      });

      const count = await alertService.expireOldAlerts(24);

      expect(count).toBe(0);
    });
  });

  describe('cleanupOldAlerts', () => {
    it('should delete old resolved/dismissed alerts', async () => {
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

      await Alert.create({
        type: 'mocked_gps',
        severity: 'high',
        staff: mockObjectId(),
        business: mockObjectId(),
        title: 'Old Resolved',
        message: 'Test',
        status: AlertStatus.RESOLVED,
        resolved: true,
        createdAt: oldDate
      });

      const count = await alertService.cleanupOldAlerts(30);

      expect(count).toBe(1);

      const alert = await Alert.findOne({ title: 'Old Resolved' });
      expect(alert).toBeNull();
    });

    it('should not delete active alerts', async () => {
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      await Alert.create({
        type: 'mocked_gps',
        severity: 'high',
        staff: mockObjectId(),
        business: mockObjectId(),
        title: 'Old Active',
        message: 'Test',
        status: AlertStatus.ACTIVE,
        acknowledged: false,
        createdAt: oldDate
      });

      const count = await alertService.cleanupOldAlerts(30);

      expect(count).toBe(0);
    });
  });

  describe('getStaffAlertCount', () => {
    beforeEach(async () => {
      const staffId = mockObjectId();

      await Alert.create([
        {
          type: 'mocked_gps',
          severity: 'high',
          staff: staffId,
          business: mockObjectId(),
          title: 'Active Alert',
          message: 'Test',
          status: AlertStatus.ACTIVE
        },
        {
          type: 'late_check_in',
          severity: 'medium',
          staff: staffId,
          business: mockObjectId(),
          title: 'Resolved Alert',
          message: 'Test',
          status: AlertStatus.RESOLVED
        }
      ]);
    });

    it('should return total alert count for staff', async () => {
      const staffId = (await Alert.findOne())!.staff.toString();

      const count = await alertService.getStaffAlertCount(staffId);

      expect(count).toBe(2);
    });

    it('should return active alert count when activeOnly is true', async () => {
      const staffId = (await Alert.findOne())!.staff.toString();

      const count = await alertService.getStaffAlertCount(staffId, true);

      expect(count).toBe(1);
    });
  });
});
