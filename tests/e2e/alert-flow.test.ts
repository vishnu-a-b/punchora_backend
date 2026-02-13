/**
 * E2E Test: Alert Flow
 * Tests complete workflow: create → acknowledge → resolve → verify cleanup
 */

import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';
import { Staff } from '../../src/modules/staff/models/Staff';
import { Alert, AlertStatus } from '../../src/modules/alert/models/Alert';
import AlertService from '../../src/modules/alert/services/AlertService';

describe('E2E: Alert Flow', () => {
  setupTestDB();

  let alertService: AlertService;
  let businessId: string;
  let staffId: string;
  let userId: string;

  beforeEach(async () => {
    alertService = new AlertService();
    businessId = mockObjectId().toString();
    userId = mockObjectId().toString();

    // Create test staff
    const staff = await Staff.create({
      name: 'Alert Test Staff',
      uid: 'ALERT001',
      business: businessId,
      isActive: true
    });
    staffId = staff._id.toString();
  });

  it('should complete full alert lifecycle', async () => {
    // Step 1: Create alert
    const alert = await alertService.createAlert({
      type: 'mocked_gps',
      severity: 'high',
      staff: staffId,
      business: businessId,
      title: 'GPS Spoofing Detected',
      message: 'Mocked GPS location detected during check-in',
      priority: 5
    });

    expect(alert._id).toBeTruthy();
    expect(alert.status).toBe(AlertStatus.ACTIVE);
    expect(alert.acknowledged).toBe(false);
    expect(alert.resolved).toBe(false);

    // Step 2: Acknowledge alert
    const acknowledged = await alertService.acknowledgeAlert(
      (alert as any)._id.toString(),
      {
        userId: userId,
        userName: 'Admin User'
      }
    );

    expect(acknowledged).toBeTruthy();
    expect(acknowledged!.acknowledged).toBe(true);
    expect(acknowledged!.status).toBe(AlertStatus.ACKNOWLEDGED);
    expect(acknowledged!.acknowledgedAt).toBeTruthy();
    expect(acknowledged!.acknowledgedByName).toBe('Admin User');

    // Step 3: Resolve alert
    const resolved = await alertService.resolveAlert(
      (alert as any)._id.toString(),
      {
        userId: userId,
        resolutionNotes: 'GPS spoofing issue resolved. Staff warned.'
      }
    );

    expect(resolved).toBeTruthy();
    expect(resolved!.resolved).toBe(true);
    expect(resolved!.status).toBe(AlertStatus.RESOLVED);
    expect(resolved!.resolvedAt).toBeTruthy();
    expect(resolved!.resolutionNotes).toContain('resolved');

    // Step 4: Verify final state
    const finalAlert = await alertService.getAlertById((alert as any)._id.toString());
    expect(finalAlert).toBeTruthy();
    expect(finalAlert!.status).toBe(AlertStatus.RESOLVED);
    expect(finalAlert!.acknowledged).toBe(true);
    expect(finalAlert!.resolved).toBe(true);
  });

  it('should prevent duplicate alerts within 1 hour', async () => {
    // Create first alert
    const alert1 = await alertService.createAlert({
      type: 'late_check_in',
      severity: 'medium',
      staff: staffId,
      business: businessId,
      title: 'Late Check-in',
      message: 'Staff checked in 30 minutes late',
      priority: 3
    });

    // Try to create duplicate alert immediately
    const alert2 = await alertService.createAlert({
      type: 'late_check_in',
      severity: 'medium',
      staff: staffId,
      business: businessId,
      title: 'Late Check-in',
      message: 'Staff checked in 30 minutes late',
      priority: 3
    });

    // Should return the same alert (deduplication)
    expect((alert1 as any)._id.toString()).toBe((alert2 as any)._id.toString());
  });

  it('should update priority for duplicate high-priority alerts', async () => {
    // Create alert with medium priority
    await alertService.createAlert({
      type: 'mocked_gps',
      severity: 'medium',
      staff: staffId,
      business: businessId,
      title: 'GPS Issue',
      message: 'GPS accuracy low',
      priority: 3
    });

    // Create duplicate with higher priority
    const alert2 = await alertService.createAlert({
      type: 'mocked_gps',
      severity: 'critical',
      staff: staffId,
      business: businessId,
      title: 'GPS Spoofing',
      message: 'Confirmed GPS spoofing',
      priority: 5
    });

    // Should update priority to higher value
    expect(alert2.priority).toBe(5);
  });

  it('should retrieve alerts with various filters', async () => {
    // Create multiple alerts
    await Promise.all([
      alertService.createAlert({
        type: 'mocked_gps',
        severity: 'high',
        staff: staffId,
        business: businessId,
        title: 'GPS Alert 1',
        message: 'Test',
        priority: 5
      }),
      alertService.createAlert({
        type: 'late_check_in',
        severity: 'medium',
        staff: staffId,
        business: businessId,
        title: 'Late Alert',
        message: 'Test',
        priority: 3
      }),
      alertService.createAlert({
        type: 'missing_checkout',
        severity: 'low',
        staff: staffId,
        business: businessId,
        title: 'Missing Checkout',
        message: 'Test',
        priority: 2
      })
    ]);

    // Filter by type
    const gpAlerts = await alertService.getAlerts(
      { type: 'mocked_gps' },
      {}
    );
    expect(gpAlerts.alerts.length).toBeGreaterThan(0);
    expect(gpAlerts.alerts.every(a => a.type === 'mocked_gps')).toBe(true);

    // Filter by severity
    const highSeverity = await alertService.getAlerts(
      { severity: 'high' },
      {}
    );
    expect(highSeverity.alerts.every(a => a.severity === 'high')).toBe(true);

    // Filter by business
    const businessAlerts = await alertService.getAlerts(
      { business: businessId },
      {}
    );
    expect(businessAlerts.alerts.length).toBeGreaterThan(0);
  });

  it('should generate alert statistics', async () => {
    // Create various alerts
    await Promise.all([
      alertService.createAlert({
        type: 'mocked_gps',
        severity: 'high',
        staff: staffId,
        business: businessId,
        title: 'GPS 1',
        message: 'Test',
        priority: 5
      }),
      alertService.createAlert({
        type: 'mocked_gps',
        severity: 'high',
        staff: staffId,
        business: businessId,
        title: 'GPS 2',
        message: 'Test',
        priority: 5
      }),
      alertService.createAlert({
        type: 'late_check_in',
        severity: 'medium',
        staff: staffId,
        business: businessId,
        title: 'Late',
        message: 'Test',
        priority: 3
      })
    ]);

    const stats = await alertService.getAlertStats(businessId);

    expect(stats.overview.total).toBeGreaterThan(0);
    expect(stats.byType).toBeInstanceOf(Array);
    expect(stats.bySeverity).toBeInstanceOf(Array);
    expect(stats.byStatus).toBeInstanceOf(Array);

    // Verify type breakdown
    const mockedGpsCount = stats.byType.find((t: any) => t._id === 'mocked_gps');
    expect(mockedGpsCount).toBeDefined();
    expect(mockedGpsCount.count).toBeGreaterThan(0);
  });

  it('should handle alert dismissal', async () => {
    const alert = await alertService.createAlert({
      type: 'low_priority_alert',
      severity: 'low',
      staff: staffId,
      business: businessId,
      title: 'Low Priority',
      message: 'Can be dismissed',
      priority: 1
    });

    const dismissed = await alertService.dismissAlert((alert as any)._id.toString());

    expect(dismissed).toBeTruthy();
    expect(dismissed!.status).toBe(AlertStatus.DISMISSED);
  });

  it('should expire old unacknowledged alerts', async () => {
    // Create old alert (simulate by backdating)
    const oldAlert = await Alert.create({
      type: 'old_alert',
      severity: 'medium',
      staff: staffId,
      business: businessId,
      title: 'Old Alert',
      message: 'Test',
      status: AlertStatus.ACTIVE,
      acknowledged: false,
      priority: 3,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours ago
    });

    // Run expiration (24 hour threshold)
    const expiredCount = await alertService.expireOldAlerts(24);

    expect(expiredCount).toBeGreaterThan(0);

    // Verify alert is now dismissed
    const updatedAlert = await Alert.findById(oldAlert._id);
    expect(updatedAlert!.status).toBe(AlertStatus.DISMISSED);
  });

  it('should cleanup old resolved alerts', async () => {
    // Create old resolved alert
    const oldResolved = await Alert.create({
      type: 'old_resolved',
      severity: 'medium',
      staff: staffId,
      business: businessId,
      title: 'Old Resolved',
      message: 'Test',
      status: AlertStatus.RESOLVED,
      resolved: true,
      priority: 3,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
    });

    const oldId = oldResolved._id;

    // Run cleanup (30 day threshold)
    const deletedCount = await alertService.cleanupOldAlerts(30);

    expect(deletedCount).toBeGreaterThan(0);

    // Verify alert is deleted
    const deleted = await Alert.findById(oldId);
    expect(deleted).toBeNull();
  });

  it('should get staff alert count', async () => {
    // Create multiple alerts for staff
    await Promise.all([
      alertService.createAlert({
        type: 'alert1',
        severity: 'high',
        staff: staffId,
        business: businessId,
        title: 'Alert 1',
        message: 'Test',
        priority: 5
      }),
      alertService.createAlert({
        type: 'alert2',
        severity: 'medium',
        staff: staffId,
        business: businessId,
        title: 'Alert 2',
        message: 'Test',
        priority: 3
      })
    ]);

    // Resolve one
    const alerts = await Alert.find({ staff: staffId });
    await alertService.resolveAlert((alerts[0] as any)._id.toString(), { userId: userId });

    // Get total count
    const totalCount = await alertService.getStaffAlertCount(staffId);
    expect(totalCount).toBe(2);

    // Get active count
    const activeCount = await alertService.getStaffAlertCount(staffId, true);
    expect(activeCount).toBe(1);
  });

  it('should get active alerts only', async () => {
    // Create mix of active and resolved
    const alert1 = await alertService.createAlert({
      type: 'active_alert',
      severity: 'high',
      staff: staffId,
      business: businessId,
      title: 'Active',
      message: 'Test',
      priority: 5
    });

    const alert2 = await alertService.createAlert({
      type: 'to_resolve',
      severity: 'medium',
      staff: staffId,
      business: businessId,
      title: 'To Resolve',
      message: 'Test',
      priority: 3
    });

    // Resolve one
    await alertService.resolveAlert((alert2 as any)._id.toString(), { userId: userId });

    // Get active alerts
    const activeAlerts = await alertService.getActiveAlerts(businessId);

    expect(activeAlerts.length).toBeGreaterThan(0);
    expect(activeAlerts.every(a => a.status === 'active')).toBe(true);
  });
});
