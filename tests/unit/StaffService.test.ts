/**
 * Unit Tests for StaffService
 * Tests staff CRUD operations and business scoping
 */

import StaffService from '../../src/modules/staff/services/StaffService';
import { Staff } from '../../src/modules/staff/models/Staff';
import { Attendance } from '../../src/modules/attendance/models/Attendance';
import { setupTestDB } from '../helpers/database';
import { mockObjectId, mockStaffData } from '../helpers/fixtures';

describe('StaffService', () => {
  setupTestDB();

  let staffService: StaffService;

  beforeEach(() => {
    staffService = new StaffService();
  });

  describe('create', () => {
    it('should create staff with valid data', async () => {
      const staffData = {
        name: 'John Doe',
        uid: 'STAFF001',
        email: 'john@example.com',
        phone: '1234567890',
        business: mockObjectId(),
        department: mockObjectId(),
        isActive: true,
        role: 'staff'
      };

      const staff = await staffService.create(staffData);

      expect(staff._id).toBeTruthy();
      expect(staff.name).toBe(staffData.name);
      expect(staff.uid).toBe(staffData.uid);
      expect(staff.email).toBe(staffData.email);
      expect(staff.isActive).toBe(true);
    });

    it('should create staff without optional fields', async () => {
      const minimalData = {
        name: 'Jane Doe',
        business: mockObjectId(),
        isActive: true
      };

      const staff = await staffService.create(minimalData);

      expect(staff._id).toBeTruthy();
      expect(staff.name).toBe(minimalData.name);
    });
  });

  describe('find', () => {
    beforeEach(async () => {
      const businessId = mockObjectId();
      const dept1 = mockObjectId();
      const dept2 = mockObjectId();

      await Staff.create([
        {
          name: 'Alice Smith',
          uid: 'STAFF001',
          business: businessId,
          department: dept1,
          isActive: true,
          role: 'staff'
        },
        {
          name: 'Bob Johnson',
          uid: 'STAFF002',
          business: businessId,
          department: dept2,
          isActive: true,
          role: 'manager'
        },
        {
          name: 'Charlie Brown',
          uid: 'STAFF003',
          business: businessId,
          department: dept1,
          isActive: false,
          role: 'staff'
        }
      ]);
    });

    it('should return paginated staff list with defaults', async () => {
      const result = await staffService.find({
        filterQuery: {},
        limit: 10,
        skip: 0,
        sort: { name: 1 }
      });

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.skip).toBe(0);
    });

    it('should filter staff by business', async () => {
      const businessId = (await Staff.findOne())!.business.toString();

      const result = await staffService.find({
        filterQuery: { business: businessId },
        limit: 10,
        skip: 0
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.every(s => s.business.toString() === businessId)).toBe(true);
    });

    it('should filter staff by department', async () => {
      const staff = await Staff.findOne();
      const departmentId = staff!.department.toString();

      const result = await staffService.find({
        filterQuery: { department: departmentId },
        limit: 10,
        skip: 0
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.every(s => s.department.toString() === departmentId)).toBe(true);
    });

    it('should filter by isActive status', async () => {
      const result = await staffService.find({
        filterQuery: { isActive: true },
        limit: 10,
        skip: 0
      });

      expect(result.items.every(s => s.isActive === true)).toBe(true);
    });

    it('should filter by role', async () => {
      const result = await staffService.find({
        filterQuery: { role: 'manager' },
        limit: 10,
        skip: 0
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].role).toBe('manager');
    });

    it('should handle pagination correctly', async () => {
      const page1 = await staffService.find({
        filterQuery: {},
        limit: 2,
        skip: 0,
        sort: { name: 1 }
      });

      const page2 = await staffService.find({
        filterQuery: {},
        limit: 2,
        skip: 2,
        sort: { name: 1 }
      });

      expect(page1.items).toHaveLength(2);
      expect(page2.items).toHaveLength(1);
      expect(page1.total).toBe(3);
      expect(page2.total).toBe(3);
    });

    it('should sort staff by name', async () => {
      const result = await staffService.find({
        filterQuery: {},
        limit: 10,
        skip: 0,
        sort: { name: 1 }
      });

      expect(result.items[0].name).toBe('Alice Smith');
      expect(result.items[2].name).toBe('Charlie Brown');
    });
  });

  describe('findAndGetAttendance', () => {
    beforeEach(async () => {
      const businessId = mockObjectId();
      const staff1 = await Staff.create({
        name: 'Staff One',
        uid: 'S001',
        business: businessId,
        isActive: true
      });

      const staff2 = await Staff.create({
        name: 'Staff Two',
        uid: 'S002',
        business: businessId,
        isActive: true
      });

      // Create today's attendance for staff1
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await Attendance.create({
        staff: staff1._id,
        date: today,
        checkInTime: new Date(),
        status: 'checked-in'
      });
    });

    it('should return staff with today\'s attendance', async () => {
      const result = await staffService.findAndGetAttendance({
        filterQuery: {},
        limit: 10,
        skip: 0
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].attendance).toBeDefined();
    });

    it('should return null attendance for staff without check-in today', async () => {
      const result = await staffService.findAndGetAttendance({
        filterQuery: { name: 'Staff Two' },
        limit: 10,
        skip: 0
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].attendance).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should find staff by ID with populated fields', async () => {
      const staff = await Staff.create({
        name: 'Test Staff',
        uid: 'TEST001',
        business: mockObjectId(),
        department: mockObjectId(),
        isActive: true
      });

      const found = await staffService.findOne(staff._id.toString());

      expect(found).toBeTruthy();
      expect(found!._id.toString()).toBe(staff._id.toString());
      expect(found!.name).toBe('Test Staff');
    });

    it('should return null for non-existent ID', async () => {
      const fakeId = mockObjectId().toString();

      const found = await staffService.findOne(fakeId);

      expect(found).toBeNull();
    });
  });

  describe('findOneWithUserId', () => {
    it('should find staff by user ID', async () => {
      const userId = mockObjectId();

      await Staff.create({
        name: 'User Staff',
        uid: 'USER001',
        user: userId,
        business: mockObjectId(),
        isActive: true
      });

      const found = await staffService.findOneWithUserId(userId.toString());

      expect(found).toBeTruthy();
      expect(found.user.toString()).toBe(userId.toString());
    });

    it('should throw NotFoundError if staff not found', async () => {
      const fakeUserId = mockObjectId().toString();

      await expect(
        staffService.findOneWithUserId(fakeUserId)
      ).rejects.toThrow('Staff not found');
    });
  });

  describe('update', () => {
    it('should update staff successfully', async () => {
      const staff = await Staff.create({
        name: 'Original Name',
        uid: 'UPDATE001',
        business: mockObjectId(),
        isActive: true
      });

      await staffService.update({
        id: staff._id.toString(),
        staff: { name: 'Updated Name' }
      });

      const updated = await Staff.findById(staff._id);
      expect(updated!.name).toBe('Updated Name');
    });

    it('should update multiple fields', async () => {
      const staff = await Staff.create({
        name: 'Test Staff',
        uid: 'TEST001',
        business: mockObjectId(),
        isActive: true,
        role: 'staff'
      });

      await staffService.update({
        id: staff._id.toString(),
        staff: {
          name: 'New Name',
          role: 'manager',
          isActive: false
        }
      });

      const updated = await Staff.findById(staff._id);
      expect(updated!.name).toBe('New Name');
      expect(updated!.role).toBe('manager');
      expect(updated!.isActive).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete staff successfully', async () => {
      const staff = await Staff.create({
        name: 'Delete Test',
        uid: 'DEL001',
        business: mockObjectId(),
        isActive: true
      });

      await staffService.delete(staff._id.toString());

      const deleted = await Staff.findById(staff._id);
      expect(deleted).toBeNull();
    });

    it('should return null when deleting non-existent staff', async () => {
      const fakeId = mockObjectId().toString();

      const result = await staffService.delete(fakeId);

      expect(result).toBeNull();
    });
  });

  describe('countTotalDocuments', () => {
    it('should return correct total count', async () => {
      await Staff.create([
        { name: 'Staff 1', business: mockObjectId(), isActive: true },
        { name: 'Staff 2', business: mockObjectId(), isActive: true },
        { name: 'Staff 3', business: mockObjectId(), isActive: false }
      ]);

      const count = await staffService.countTotalDocuments();

      expect(count).toBe(3);
    });

    it('should return 0 when no staff exists', async () => {
      const count = await staffService.countTotalDocuments();

      expect(count).toBe(0);
    });
  });
});
