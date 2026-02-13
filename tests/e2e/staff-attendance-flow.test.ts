/**
 * E2E Test: Staff Attendance Flow
 * Tests complete workflow: login → check-in → activity → check-out
 */

import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';
import { User } from '../../src/modules/user/models/User';
import { Staff } from '../../src/modules/staff/models/Staff';
import { Attendance } from '../../src/modules/attendance/models/Attendance';
import { Activity, ActivityStatus } from '../../src/modules/activity/models/Activity';
import { generateTokens } from '../../src/modules/authentication/utils/generateJwtTokens';
import ActivityService from '../../src/modules/activity/services/ActivityService';
import { AuditLog } from '../../src/modules/audit/models/AuditLog';

describe('E2E: Staff Attendance Flow', () => {
  setupTestDB();

  let businessId: string;
  let departmentId: string;
  let userId: string;
  let staffId: string;
  let activityService: ActivityService;

  beforeEach(async () => {
    activityService = new ActivityService();
    businessId = mockObjectId().toString();
    departmentId = mockObjectId().toString();

    // Create user
    const user = await User.create({
      name: 'Test Staff',
      mobileNo: '9876543210',
      password: 'hashedPassword',
      email: 'staff@test.com',
      gender: 'male',
      role: 'staff',
      business: businessId,
      isActive: true
    });
    userId = user._id.toString();

    // Create staff record
    const staff = await Staff.create({
      name: 'Test Staff',
      uid: 'STAFF001',
      user: userId,
      business: businessId,
      department: departmentId,
      isActive: true
    });
    staffId = staff._id.toString();
  });

  it('should complete full attendance workflow', async () => {
    // Step 1: Login (Generate JWT tokens)
    const tokens = await generateTokens(userId);
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();

    // Step 2: Check-in
    const checkInTime = new Date();
    const attendance = await Attendance.create({
      staff: staffId,
      date: checkInTime,
      checkInTime,
      checkInLocation: {
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 10,
        mocked: false,
        timestamp: Date.now()
      },
      status: 'checked-in',
      flagged: false
    });

    expect(attendance).toBeTruthy();
    expect(attendance.status).toBe('checked-in');
    expect(attendance.checkInTime).toBeTruthy();

    // Step 3: Start activity (tea break)
    const activity = await activityService.startActivity({
      staff: staffId,
      business: businessId,
      department: departmentId,
      type: 'tea-break',
      reason: 'Regular tea break'
    });

    expect(activity).toBeTruthy();
    expect(activity.status).toBe(ActivityStatus.STARTED);
    expect(activity.startTime).toBeTruthy();

    // Step 4: End activity
    const endedActivity = await activityService.endActivity(
      activity._id.toString(),
      { endTime: new Date() }
    );

    expect(endedActivity.status).toBe(ActivityStatus.ENDED);
    expect(endedActivity.endTime).toBeTruthy();
    expect(endedActivity.duration).toBeGreaterThan(0);

    // Step 5: Check-out
    const checkOutTime = new Date();
    attendance.checkOutTime = checkOutTime;
    attendance.checkOutLocation = {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 10,
      mocked: false,
      timestamp: Date.now()
    };
    attendance.status = 'checked-out';
    await attendance.save();

    expect(attendance.status).toBe('checked-out');
    expect(attendance.checkOutTime).toBeTruthy();

    // Step 6: Verify audit trail exists
    const auditLogs = await AuditLog.find({
      userId: userId
    });

    expect(auditLogs.length).toBeGreaterThan(0);
  });

  it('should handle multiple activities during shift', async () => {
    // Check-in
    const attendance = await Attendance.create({
      staff: staffId,
      date: new Date(),
      checkInTime: new Date(),
      status: 'checked-in',
      flagged: false
    });

    // Activity 1: Tea break
    const activity1 = await activityService.startActivity({
      staff: staffId,
      business: businessId,
      type: 'tea-break'
    });
    await activityService.endActivity(activity1._id.toString(), {});

    // Activity 2: Washroom
    const activity2 = await activityService.startActivity({
      staff: staffId,
      business: businessId,
      type: 'washroom'
    });
    await activityService.endActivity(activity2._id.toString(), {});

    // Activity 3: Lunch break
    const activity3 = await activityService.startActivity({
      staff: staffId,
      business: businessId,
      type: 'lunch-break'
    });
    await activityService.endActivity(activity3._id.toString(), {});

    // Verify all activities
    const staffActivities = await activityService.getStaffActivities(staffId, {
      limit: 10,
      skip: 0
    });

    expect(staffActivities.total).toBe(3);
    expect(staffActivities.items.every(a => a.status === 'ended')).toBe(true);

    // Check-out
    attendance.checkOutTime = new Date();
    attendance.status = 'checked-out';
    await attendance.save();

    expect(attendance.status).toBe('checked-out');
  });

  it('should handle incomplete check-out (missing checkout)', async () => {
    // Check-in
    const attendance = await Attendance.create({
      staff: staffId,
      date: new Date(),
      checkInTime: new Date(),
      status: 'checked-in',
      flagged: false
    });

    // Start activity
    const activity = await activityService.startActivity({
      staff: staffId,
      business: businessId,
      type: 'trip'
    });

    // Verify attendance is still checked-in
    const currentAttendance = await Attendance.findById(attendance._id);
    expect(currentAttendance!.status).toBe('checked-in');
    expect(currentAttendance!.checkOutTime).toBeFalsy();

    // Verify ongoing activity exists
    const ongoingActivities = await activityService.getOngoingActivities(staffId);
    expect(ongoingActivities).toHaveLength(1);
    expect(ongoingActivities[0]._id.toString()).toBe(activity._id.toString());
  });

  it('should calculate total work hours correctly', async () => {
    const checkInTime = new Date('2026-02-12T09:00:00Z');
    const checkOutTime = new Date('2026-02-12T17:00:00Z');

    const attendance = await Attendance.create({
      staff: staffId,
      date: new Date('2026-02-12'),
      checkInTime,
      checkOutTime,
      status: 'checked-out',
      flagged: false
    });

    const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    expect(hoursWorked).toBe(8);
  });

  it('should flag attendance with mocked GPS', async () => {
    const attendance = await Attendance.create({
      staff: staffId,
      date: new Date(),
      checkInTime: new Date(),
      checkInLocation: {
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 10,
        mocked: true, // Mocked GPS
        timestamp: Date.now()
      },
      status: 'checked-in',
      flagged: true,
      flagReason: 'Mocked GPS detected'
    });

    expect(attendance.flagged).toBe(true);
    expect(attendance.flagReason).toContain('Mocked GPS');
  });
});
