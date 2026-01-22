/**
 * Unit Tests for ActivityService
 * Tests activity tracking functionality
 */

import ActivityService from '../../src/modules/activity/services/ActivityService';
import { Activity, ActivityStatus, ActivityType } from '../../src/modules/activity/models/Activity';
import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';

describe('ActivityService', () => {
  setupTestDB();

  let activityService: ActivityService;

  beforeEach(() => {
    activityService = new ActivityService();
  });

  describe('startActivity', () => {
    it('should create a new activity with started status', async () => {
      const staffId = mockObjectId().toString();
      const businessId = mockObjectId().toString();
      const departmentId = mockObjectId().toString();

      const activityData = {
        staff: staffId,
        business: businessId,
        department: departmentId,
        type: 'tea-break' as ActivityType,
        reason: 'Regular tea break',
        gpsLocation: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10
        }
      };

      const activity = await activityService.startActivity(activityData);

      expect(activity).toBeTruthy();
      expect(activity.staff.toString()).toBe(staffId);
      expect(activity.status).toBe(ActivityStatus.STARTED);
      expect(activity.type).toBe('tea-break');
      expect(activity.startTime).toBeTruthy();
    });

    it('should set startTime automatically if not provided', async () => {
      const now = new Date();

      const activity = await activityService.startActivity({
        staff: mockObjectId().toString(),
        business: mockObjectId().toString(),
        type: 'washroom' as ActivityType
      });

      expect(activity.startTime).toBeTruthy();
      expect(activity.startTime.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });

    it('should accept custom startTime', async () => {
      const customTime = new Date('2026-01-21T10:00:00Z');

      const activity = await activityService.startActivity({
        staff: mockObjectId().toString(),
        business: mockObjectId().toString(),
        type: 'lunch-break' as ActivityType,
        startTime: customTime
      });

      expect(activity.startTime.getTime()).toBe(customTime.getTime());
    });
  });

  describe('endActivity', () => {
    it('should end an ongoing activity and calculate duration', async () => {
      const startTime = new Date('2026-01-21T10:00:00Z');
      const endTime = new Date('2026-01-21T10:15:00Z');

      // Create activity first
      const activity = await Activity.create({
        staff: mockObjectId(),
        business: mockObjectId(),
        type: 'tea-break',
        status: ActivityStatus.STARTED,
        startTime
      });

      // End the activity
      const endedActivity = await activityService.endActivity(
        activity._id.toString(),
        { endTime }
      );

      expect(endedActivity.status).toBe(ActivityStatus.ENDED);
      expect(endedActivity.endTime).toBeTruthy();
      expect(endedActivity.duration).toBe(15); // 15 minutes
    });

    it('should throw error if activity not found', async () => {
      const fakeId = mockObjectId().toString();

      await expect(
        activityService.endActivity(fakeId, {})
      ).rejects.toThrow('Activity not found');
    });

    it('should throw error if activity already ended', async () => {
      const activity = await Activity.create({
        staff: mockObjectId(),
        business: mockObjectId(),
        type: 'washroom',
        status: ActivityStatus.ENDED,
        startTime: new Date(),
        endTime: new Date()
      });

      await expect(
        activityService.endActivity(activity._id.toString(), {})
      ).rejects.toThrow('Activity already ended');
    });

    it('should use current time if endTime not provided', async () => {
      const now = new Date();

      const activity = await Activity.create({
        staff: mockObjectId(),
        business: mockObjectId(),
        type: 'trip',
        status: ActivityStatus.STARTED,
        startTime: new Date(now.getTime() - 3600000) // 1 hour ago
      });

      const endedActivity = await activityService.endActivity(
        activity._id.toString(),
        {}
      );

      expect(endedActivity.endTime).toBeTruthy();
      expect(endedActivity.endTime!.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });
  });

  describe('getStaffActivities', () => {
    beforeEach(async () => {
      const staffId = mockObjectId();
      const businessId = mockObjectId();

      // Create test activities
      await Activity.create([
        {
          staff: staffId,
          business: businessId,
          type: 'tea-break',
          status: ActivityStatus.STARTED,
          startTime: new Date('2026-01-21T10:00:00Z')
        },
        {
          staff: staffId,
          business: businessId,
          type: 'lunch-break',
          status: ActivityStatus.ENDED,
          startTime: new Date('2026-01-21T12:00:00Z'),
          endTime: new Date('2026-01-21T13:00:00Z'),
          duration: 60
        },
        {
          staff: staffId,
          business: businessId,
          type: 'washroom',
          status: ActivityStatus.ENDED,
          startTime: new Date('2026-01-21T14:00:00Z'),
          endTime: new Date('2026-01-21T14:05:00Z'),
          duration: 5
        }
      ]);
    });

    it('should return paginated staff activities sorted by startTime', async () => {
      const staffId = (await Activity.findOne())!.staff.toString();

      const result = await activityService.getStaffActivities(staffId, {
        limit: 10,
        skip: 0
      });

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);

      // Verify sorting by startTime descending
      expect(result.items[0].startTime.getTime()).toBeGreaterThan(
        result.items[1].startTime.getTime()
      );
    });

    it('should filter activities by status', async () => {
      const staffId = (await Activity.findOne())!.staff.toString();

      const result = await activityService.getStaffActivities(staffId, {
        status: 'ended'
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.every(item => item.status === 'ended')).toBe(true);
    });

    it('should filter activities by type', async () => {
      const staffId = (await Activity.findOne())!.staff.toString();

      const result = await activityService.getStaffActivities(staffId, {
        type: 'tea-break'
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe('tea-break');
    });

    it('should filter activities by date range', async () => {
      const staffId = (await Activity.findOne())!.staff.toString();

      const result = await activityService.getStaffActivities(staffId, {
        startDate: new Date('2026-01-21T12:00:00Z'),
        endDate: new Date('2026-01-21T15:00:00Z')
      });

      expect(result.items).toHaveLength(2);
    });

    it('should handle pagination correctly', async () => {
      const staffId = (await Activity.findOne())!.staff.toString();

      const result = await activityService.getStaffActivities(staffId, {
        limit: 2,
        skip: 1
      });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(3);
    });
  });

  describe('getOngoingActivities', () => {
    it('should return only started activities', async () => {
      const staffId = mockObjectId();
      const businessId = mockObjectId();

      await Activity.create([
        {
          staff: staffId,
          business: businessId,
          type: 'trip',
          status: ActivityStatus.STARTED,
          startTime: new Date()
        },
        {
          staff: staffId,
          business: businessId,
          type: 'tea-break',
          status: ActivityStatus.STARTED,
          startTime: new Date()
        },
        {
          staff: staffId,
          business: businessId,
          type: 'lunch-break',
          status: ActivityStatus.ENDED,
          startTime: new Date(),
          endTime: new Date()
        }
      ]);

      const ongoing = await activityService.getOngoingActivities(staffId.toString());

      expect(ongoing).toHaveLength(2);
      expect(ongoing.every(activity => activity.status === 'started')).toBe(true);
    });

    it('should return empty array if no ongoing activities', async () => {
      const staffId = mockObjectId();

      const ongoing = await activityService.getOngoingActivities(staffId.toString());

      expect(ongoing).toHaveLength(0);
    });
  });

  describe('getActivityById', () => {
    it('should return activity by ID with populated fields', async () => {
      const activity = await Activity.create({
        staff: mockObjectId(),
        business: mockObjectId(),
        department: mockObjectId(),
        type: 'care-or-onsite',
        status: ActivityStatus.STARTED,
        startTime: new Date(),
        location: 'Client Site A',
        reason: 'Client meeting'
      });

      const found = await activityService.getActivityById(activity._id.toString());

      expect(found).toBeTruthy();
      expect(found!._id.toString()).toBe(activity._id.toString());
      expect(found!.type).toBe('care-or-onsite');
      expect(found!.location).toBe('Client Site A');
    });

    it('should return null if activity not found', async () => {
      const fakeId = mockObjectId().toString();

      const found = await activityService.getActivityById(fakeId);

      expect(found).toBeNull();
    });
  });

  describe('getBusinessActivities', () => {
    beforeEach(async () => {
      const businessId = mockObjectId();
      const dept1 = mockObjectId();
      const dept2 = mockObjectId();

      await Activity.create([
        {
          staff: mockObjectId(),
          business: businessId,
          department: dept1,
          type: 'tea-break',
          status: ActivityStatus.STARTED,
          startTime: new Date('2026-01-21T10:00:00Z')
        },
        {
          staff: mockObjectId(),
          business: businessId,
          department: dept1,
          type: 'lunch-break',
          status: ActivityStatus.ENDED,
          startTime: new Date('2026-01-21T12:00:00Z'),
          endTime: new Date('2026-01-21T13:00:00Z')
        },
        {
          staff: mockObjectId(),
          business: businessId,
          department: dept2,
          type: 'trip',
          status: ActivityStatus.STARTED,
          startTime: new Date('2026-01-21T14:00:00Z')
        }
      ]);
    });

    it('should return paginated business activities', async () => {
      const businessId = (await Activity.findOne())!.business.toString();

      const result = await activityService.getBusinessActivities(businessId, {
        limit: 10,
        skip: 0
      });

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should filter by department', async () => {
      const activity = await Activity.findOne();
      const businessId = activity!.business.toString();
      const departmentId = activity!.department!.toString();

      const result = await activityService.getBusinessActivities(businessId, {
        departmentId
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.every(
        item => item.department?.toString() === departmentId
      )).toBe(true);
    });
  });

  describe('deleteActivity', () => {
    it('should delete activity and return true', async () => {
      const activity = await Activity.create({
        staff: mockObjectId(),
        business: mockObjectId(),
        type: 'washroom',
        status: ActivityStatus.STARTED,
        startTime: new Date()
      });

      const deleted = await activityService.deleteActivity(activity._id.toString());

      expect(deleted).toBe(true);

      const found = await Activity.findById(activity._id);
      expect(found).toBeNull();
    });

    it('should return false if activity not found', async () => {
      const fakeId = mockObjectId().toString();

      const deleted = await activityService.deleteActivity(fakeId);

      expect(deleted).toBe(false);
    });
  });

  describe('getActivityStats', () => {
    it('should aggregate activity statistics by type', async () => {
      const staffId = mockObjectId();
      const startDate = new Date('2026-01-21T00:00:00Z');
      const endDate = new Date('2026-01-21T23:59:59Z');

      await Activity.create([
        {
          staff: staffId,
          business: mockObjectId(),
          type: 'tea-break',
          status: ActivityStatus.ENDED,
          startTime: new Date('2026-01-21T10:00:00Z'),
          endTime: new Date('2026-01-21T10:15:00Z'),
          duration: 15
        },
        {
          staff: staffId,
          business: mockObjectId(),
          type: 'tea-break',
          status: ActivityStatus.ENDED,
          startTime: new Date('2026-01-21T15:00:00Z'),
          endTime: new Date('2026-01-21T15:15:00Z'),
          duration: 15
        },
        {
          staff: staffId,
          business: mockObjectId(),
          type: 'lunch-break',
          status: ActivityStatus.ENDED,
          startTime: new Date('2026-01-21T12:00:00Z'),
          endTime: new Date('2026-01-21T13:00:00Z'),
          duration: 60
        }
      ]);

      const stats = await activityService.getActivityStats(
        staffId.toString(),
        startDate,
        endDate
      );

      expect(stats).toHaveLength(2);

      const teaBreakStats = stats.find(s => s._id === 'tea-break');
      expect(teaBreakStats).toBeTruthy();
      expect(teaBreakStats!.count).toBe(2);
      expect(teaBreakStats!.totalDuration).toBe(30);

      const lunchStats = stats.find(s => s._id === 'lunch-break');
      expect(lunchStats).toBeTruthy();
      expect(lunchStats!.count).toBe(1);
      expect(lunchStats!.totalDuration).toBe(60);
    });
  });
});
