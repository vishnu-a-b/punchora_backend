/**
 * Integration Tests for Business API
 * Tests the full HTTP request/response cycle for business endpoints
 */

import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';
import { Business } from '../../src/modules/business/models/Business';
import BusinessService from '../../src/modules/business/services/BusinessService';

describe('Business API Integration', () => {
  setupTestDB();

  let app: express.Application;
  let adminId: string;
  let userId: string;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req: any, res, next) => {
      req.user = {
        _id: userId,
        role: 'super_admin'
      };
      next();
    });

    // Setup business routes
    const businessRouter = Router();
    const businessService = new BusinessService();

    // GET /api/business - List businesses
    businessRouter.get('/', async (req: any, res) => {
      try {
        const { limit = 10, skip = 0, admin, isActive } = req.query;
        const filterQuery: any = {};

        if (admin) filterQuery.admin = admin;
        if (isActive !== undefined) filterQuery.isActive = isActive === 'true';

        const result = await businessService.find({
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

    // GET /api/business/:id - Get single business
    businessRouter.get('/:id', async (req, res) => {
      try {
        const business = await businessService.findOne(req.params.id);
        if (!business) {
          return res.status(404).json({ error: 'Business not found' });
        }
        res.json(business);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // GET /api/business/admin/:adminId - Get businesses by admin
    businessRouter.get('/admin/:adminId', async (req, res) => {
      try {
        const businesses = await businessService.filterByAdmin(req.params.adminId);
        res.json(businesses);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // POST /api/business - Create business
    businessRouter.post('/', async (req, res) => {
      try {
        const business = await businessService.create(req.body);
        res.status(201).json(business);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // PUT /api/business/:id - Update business
    businessRouter.put('/:id', async (req, res) => {
      try {
        await businessService.update({ id: req.params.id, business: req.body });
        const updated = await businessService.findOne(req.params.id);
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // DELETE /api/business/:id - Delete business
    businessRouter.delete('/:id', async (req, res) => {
      try {
        await businessService.delete(req.params.id);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.use('/api/business', businessRouter);
  });

  beforeEach(async () => {
    adminId = mockObjectId().toString();
    userId = mockObjectId().toString();

    // Create test businesses
    await Business.create([
      {
        name: 'Tech Corp',
        admin: adminId,
        contactEmail: 'tech@example.com',
        contactPhone: '1234567890',
        isActive: true
      },
      {
        name: 'Business Solutions',
        admin: adminId,
        contactEmail: 'solutions@example.com',
        contactPhone: '9876543210',
        isActive: true
      },
      {
        name: 'Inactive Business',
        admin: mockObjectId(),
        contactEmail: 'inactive@example.com',
        isActive: false
      }
    ]);
  });

  describe('GET /api/business', () => {
    it('should return business list with pagination', async () => {
      const response = await request(app)
        .get('/api/business')
        .query({ limit: 10, skip: 0 })
        .expect(200);

      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.limit).toBe(10);
      expect(response.body.skip).toBe(0);
    });

    it('should filter businesses by admin', async () => {
      const response = await request(app)
        .get('/api/business')
        .query({ admin: adminId })
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.items.every((b: any) => b.admin.toString() === adminId)).toBe(true);
    });

    it('should filter businesses by isActive status', async () => {
      const response = await request(app)
        .get('/api/business')
        .query({ isActive: 'true' })
        .expect(200);

      expect(response.body.items.every((b: any) => b.isActive === true)).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const page1 = await request(app)
        .get('/api/business')
        .query({ limit: 2, skip: 0 })
        .expect(200);

      const page2 = await request(app)
        .get('/api/business')
        .query({ limit: 2, skip: 2 })
        .expect(200);

      expect(page1.body.items).toHaveLength(2);
      expect(page2.body.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/business/:id', () => {
    it('should return business by ID with populated address', async () => {
      const business = await Business.findOne();

      const response = await request(app)
        .get(`/api/business/${business!._id}`)
        .expect(200);

      expect(response.body._id).toBe(business!._id.toString());
      expect(response.body.name).toBe(business!.name);
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = mockObjectId();

      const response = await request(app)
        .get(`/api/business/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('Business not found');
    });
  });

  describe('GET /api/business/admin/:adminId', () => {
    it('should return all businesses for specific admin', async () => {
      const response = await request(app)
        .get(`/api/business/admin/${adminId}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every((b: any) => b.admin.toString() === adminId)).toBe(true);
    });

    it('should return empty array for admin with no businesses', async () => {
      const fakeAdminId = mockObjectId();

      const response = await request(app)
        .get(`/api/business/admin/${fakeAdminId}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('POST /api/business', () => {
    it('should create new business', async () => {
      const newBusiness = {
        name: 'New Corp',
        admin: adminId,
        contactEmail: 'new@example.com',
        contactPhone: '5555555555',
        isActive: true
      };

      const response = await request(app)
        .post('/api/business')
        .send(newBusiness)
        .expect(201);

      expect(response.body._id).toBeTruthy();
      expect(response.body.name).toBe('New Corp');
      expect(response.body.contactEmail).toBe('new@example.com');
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        // Missing required fields
        name: 'Invalid Business'
      };

      await request(app)
        .post('/api/business')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('PUT /api/business/:id', () => {
    it('should update business successfully', async () => {
      const business = await Business.findOne();

      const response = await request(app)
        .put(`/api/business/${business!._id}`)
        .send({ name: 'Updated Corp', isActive: false })
        .expect(200);

      expect(response.body.name).toBe('Updated Corp');
      expect(response.body.isActive).toBe(false);
    });

    it('should handle update of non-existent business', async () => {
      const fakeId = mockObjectId();

      const response = await request(app)
        .put(`/api/business/${fakeId}`)
        .send({ name: 'Updated' })
        .expect(200);

      expect(response.body).toBeNull();
    });
  });

  describe('DELETE /api/business/:id', () => {
    it('should delete business successfully', async () => {
      const business = await Business.findOne();

      await request(app)
        .delete(`/api/business/${business!._id}`)
        .expect(200);

      const deleted = await Business.findById(business!._id);
      expect(deleted).toBeNull();
    });

    it('should handle deletion of non-existent business', async () => {
      const fakeId = mockObjectId();

      await request(app)
        .delete(`/api/business/${fakeId}`)
        .expect(200);
    });
  });
});
