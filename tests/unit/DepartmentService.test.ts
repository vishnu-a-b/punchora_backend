/**
 * Unit Tests for DepartmentService
 * Tests department CRUD operations and filtering
 */

import DepartmentService from '../../src/modules/department/services/DepartmentService';
import { Department } from '../../src/modules/department/models/Department';
import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';

describe('DepartmentService', () => {
  setupTestDB();

  let departmentService: DepartmentService;

  beforeEach(() => {
    departmentService = new DepartmentService();
  });

  describe('create', () => {
    it('should create department with valid data', async () => {
      const departmentData = {
        name: 'Engineering',
        business: mockObjectId(),
        head: mockObjectId()
      };

      const department = await departmentService.create(departmentData);

      expect(department._id).toBeTruthy();
      expect(department.name).toBe('Engineering');
    });

    it('should create department without optional head field', async () => {
      const departmentData = {
        name: 'HR Department',
        business: mockObjectId()
      };

      const department = await departmentService.create(departmentData);

      expect(department._id).toBeTruthy();
      expect(department.name).toBe('HR Department');
    });
  });

  describe('find', () => {
    beforeEach(async () => {
      const businessId = mockObjectId();
      const head1 = mockObjectId();
      const head2 = mockObjectId();

      await Department.create([
        {
          name: 'Engineering',
          business: businessId,
          head: head1
        },
        {
          name: 'Marketing',
          business: businessId,
          head: head2
        },
        {
          name: 'Sales',
          business: mockObjectId(),
          head: head1
        }
      ]);
    });

    it('should return paginated department list', async () => {
      const result = await departmentService.find({
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

    it('should filter departments by business', async () => {
      const business = (await Department.findOne({ name: 'Engineering' }))!.business;

      const result = await departmentService.find({
        filterQuery: { business },
        limit: 10,
        skip: 0,
        sort: { name: 1 }
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.every(d => d.business.toString() === business.toString())).toBe(true);
    });

    it('should handle pagination', async () => {
      const page1 = await departmentService.find({
        filterQuery: {},
        limit: 2,
        skip: 0,
        sort: { name: 1 }
      });

      const page2 = await departmentService.find({
        filterQuery: {},
        limit: 2,
        skip: 2,
        sort: { name: 1 }
      });

      expect(page1.items).toHaveLength(2);
      expect(page2.items).toHaveLength(1);
      expect(page1.total).toBe(3);
    });

    it('should sort departments by name', async () => {
      const result = await departmentService.find({
        filterQuery: {},
        limit: 10,
        skip: 0,
        sort: { name: 1 }
      });

      expect(result.items[0].name).toBe('Engineering');
      expect(result.items[1].name).toBe('Marketing');
      expect(result.items[2].name).toBe('Sales');
    });
  });

  describe('findOne', () => {
    it('should find department by ID', async () => {
      const department = await Department.create({
        name: 'Test Department',
        business: mockObjectId()
      });

      const found = await departmentService.findOne(department._id.toString());

      expect(found).toBeTruthy();
      expect(found!._id.toString()).toBe(department._id.toString());
      expect(found!.name).toBe('Test Department');
    });

    it('should return null for non-existent ID', async () => {
      const fakeId = mockObjectId().toString();

      const found = await departmentService.findOne(fakeId);

      expect(found).toBeNull();
    });
  });

  describe('filterByHead', () => {
    beforeEach(async () => {
      const head1 = mockObjectId();
      const head2 = mockObjectId();

      await Department.create([
        {
          name: 'Department 1',
          business: mockObjectId(),
          head: head1
        },
        {
          name: 'Department 2',
          business: mockObjectId(),
          head: head1
        },
        {
          name: 'Department 3',
          business: mockObjectId(),
          head: head2
        }
      ]);
    });

    it('should return all departments for specific head', async () => {
      const department = await Department.findOne({ name: 'Department 1' });
      const headId = department!.head!.toString();

      const departments = await departmentService.filterByHead(headId);

      expect(departments).toHaveLength(2);
      expect(departments.every(d => d.head?.toString() === headId)).toBe(true);
    });

    it('should return empty array if head has no departments', async () => {
      const fakeHeadId = mockObjectId().toString();

      const departments = await departmentService.filterByHead(fakeHeadId);

      expect(departments).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update department successfully', async () => {
      const department = await Department.create({
        name: 'Original Name',
        business: mockObjectId()
      });

      await departmentService.update({
        id: department._id.toString(),
        data: { name: 'Updated Name' }
      });

      const updated = await Department.findById(department._id);
      expect(updated!.name).toBe('Updated Name');
    });

    it('should update multiple fields', async () => {
      const department = await Department.create({
        name: 'Test Department',
        business: mockObjectId()
      });

      const newHead = mockObjectId();
      await departmentService.update({
        id: department._id.toString(),
        data: {
          name: 'New Name',
          head: newHead
        }
      });

      const updated = await Department.findById(department._id);
      expect(updated!.name).toBe('New Name');
      expect(updated!.head?.toString()).toBe(newHead.toString());
    });
  });

  describe('delete', () => {
    it('should delete department successfully', async () => {
      const department = await Department.create({
        name: 'Delete Test',
        business: mockObjectId()
      });

      await departmentService.delete(department._id.toString());

      const deleted = await Department.findById(department._id);
      expect(deleted).toBeNull();
    });

    it('should return null when deleting non-existent department', async () => {
      const fakeId = mockObjectId().toString();

      const result = await departmentService.delete(fakeId);

      expect(result).toBeNull();
    });
  });

  describe('countTotalDocuments', () => {
    it('should return correct total count', async () => {
      await Department.create([
        { name: 'Department 1', business: mockObjectId() },
        { name: 'Department 2', business: mockObjectId() },
        { name: 'Department 3', business: mockObjectId() }
      ]);

      const count = await departmentService.countTotalDocuments();

      expect(count).toBe(3);
    });

    it('should return 0 when no departments exist', async () => {
      const count = await departmentService.countTotalDocuments();

      expect(count).toBe(0);
    });
  });
});
