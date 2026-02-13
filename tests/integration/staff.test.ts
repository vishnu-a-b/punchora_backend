/**
 * Integration Tests for Staff API
 * Tests the full HTTP request/response cycle for staff endpoints
 */

import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';
import { Staff } from '../../src/modules/staff/models/Staff';
import StaffService from '../../src/modules/staff/services/StaffService';

describe('Staff API Integration', () => {
  setupTestDB();

  let app: express.Application;
  let businessId: string;
  let departmentId: string;
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

    // Setup staff routes
    const staffRouter = Router();
    const staffService = new StaffService();

    // GET /api/staff - List staff
    staffRouter.get('/', async (req: any, res) => {
      try {
        const { limit = 10, skip = 0, business, department, isActive } = req.query;
        const filterQuery: any = {};

        if (business) filterQuery.business = business;
        if (department) filterQuery.department = department;
        if (isActive !== undefined) filterQuery.isActive = isActive === 'true';

        const result = await staffService.find({
          filterQuery,
          limit: parseInt(limit as string),
          skip: parseInt(skip as string),
          sort: { name: 1 }
        });

        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // GET /api/staff/:id - Get single staff
    staffRouter.get('/:id', async (req, res) => {
      try {
        const staff = await staffService.findOne(req.params.id);
        if (!staff) {
          return res.status(404).json({ error: 'Staff not found' });
        }
        res.json(staff);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // POST /api/staff - Create staff
    staffRouter.post('/', async (req, res) => {
      try {
        const staff = await staffService.create(req.body);
        res.status(201).json(staff);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // PUT /api/staff/:id - Update staff
    staffRouter.put('/:id', async (req, res) => {
      try {
        await staffService.update({ id: req.params.id, staff: req.body });
        const updated = await staffService.findOne(req.params.id);
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // DELETE /api/staff/:id - Delete staff
    staffRouter.delete('/:id', async (req, res) => {
      try {
        await staffService.delete(req.params.id);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.use('/api/staff', staffRouter);
  });

  beforeEach(async () => {
    businessId = mockObjectId().toString();
    departmentId = mockObjectId().toString();
    userId = mockObjectId().toString();

    // Create test staff members
    await Staff.create([
      {
        name: 'Alice Johnson',
        uid: 'STAFF001',
        email: 'alice@example.com',
        business: businessId,
        department: departmentId,
        isActive: true,
        role: 'staff'
      },
      {
        name: 'Bob Smith',
        uid: 'STAFF002',
        email: 'bob@example.com',
        business: businessId,
        department: departmentId,
        isActive: true,
        role: 'manager'
      },
      {
        name: 'Charlie Brown',
        uid: 'STAFF003',
        email: 'charlie@example.com',
        business: businessId,
        department: departmentId,
        isActive: false,
        role: 'staff'
      }
    ]);
  });

  describe('GET /api/staff', () => {
    it('should return staff list with pagination', async () => {
      const response = await request(app)
        .get('/api/staff')
        .query({ limit: 10, skip: 0 })
        .expect(200);

      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.limit).toBe(10);
      expect(response.body.skip).toBe(0);
    });

    it('should filter staff by business', async () => {
      const response = await request(app)
        .get('/api/staff')
        .query({ business: businessId })
        .expect(200);

      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.items.every((s: any) => s.business.toString() === businessId)).toBe(true);
    });

    it('should filter staff by department', async () => {
      const response = await request(app)
        .get('/api/staff')
        .query({ department: departmentId })
        .expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items.every((s: any) => s.department.toString() === departmentId)).toBe(true);
    });

    it('should filter staff by isActive status', async () => {
      const response = await request(app)
        .get('/api/staff')
        .query({ isActive: 'true' })
        .expect(200);

      expect(response.body.items.every((s: any) => s.isActive === true)).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const page1 = await request(app)
        .get('/api/staff')
        .query({ limit: 2, skip: 0 })
        .expect(200);

      const page2 = await request(app)
        .get('/api/staff')
        .query({ limit: 2, skip: 2 })
        .expect(200);

      expect(page1.body.items).toHaveLength(2);
      expect(page2.body.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/staff/:id', () => {
    it('should return staff by ID', async () => {
      const staff = await Staff.findOne();

      const response = await request(app)
        .get(`/api/staff/${staff!._id}`)
        .expect(200);

      expect(response.body._id).toBe(staff!._id.toString());
      expect(response.body.name).toBe(staff!.name);
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = mockObjectId();

      const response = await request(app)
        .get(`/api/staff/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('Staff not found');
    });
  });

  describe('POST /api/staff', () => {
    it('should create new staff', async () => {
      const newStaff = {
        name: 'New Staff',
        uid: 'STAFF999',
        email: 'new@example.com',
        business: businessId,
        department: departmentId,
        isActive: true,
        role: 'staff'
      };

      const response = await request(app)
        .post('/api/staff')
        .send(newStaff)
        .expect(201);

      expect(response.body._id).toBeTruthy();
      expect(response.body.name).toBe('New Staff');
      expect(response.body.uid).toBe('STAFF999');
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        // Missing required fields
        name: 'Invalid Staff'
      };

      await request(app)
        .post('/api/staff')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('PUT /api/staff/:id', () => {
    it('should update staff successfully', async () => {
      const staff = await Staff.findOne();

      const response = await request(app)
        .put(`/api/staff/${staff!._id}`)
        .send({ name: 'Updated Name', role: 'manager' })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.role).toBe('manager');
    });

    it('should handle update of non-existent staff', async () => {
      const fakeId = mockObjectId();

      const response = await request(app)
        .put(`/api/staff/${fakeId}`)
        .send({ name: 'Updated' })
        .expect(200);

      expect(response.body).toBeNull();
    });
  });

  describe('DELETE /api/staff/:id', () => {
    it('should delete staff successfully', async () => {
      const staff = await Staff.findOne();

      await request(app)
        .delete(`/api/staff/${staff!._id}`)
        .expect(200);

      const deleted = await Staff.findById(staff!._id);
      expect(deleted).toBeNull();
    });

    it('should handle deletion of non-existent staff', async () => {
      const fakeId = mockObjectId();

      await request(app)
        .delete(`/api/staff/${fakeId}`)
        .expect(200);
    });
  });
});
