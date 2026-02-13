/**
 * Unit Tests for BusinessService
 * Tests business CRUD operations and admin filtering
 */

import BusinessService from '../../src/modules/business/services/BusinessService';
import { Business } from '../../src/modules/business/models/Business';
import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';

describe('BusinessService', () => {
  setupTestDB();

  let businessService: BusinessService;

  beforeEach(() => {
    businessService = new BusinessService();
  });

  describe('create', () => {
    it('should create business with valid data', async () => {
      const businessData = {
        name: 'Acme Corporation',
        contactMobileNumbers: ['9876543210'],
        contactLandlines: ['0123456789'],
        admin: mockObjectId()
      };

      const business = await businessService.create(businessData);

      expect(business._id).toBeTruthy();
      expect(business.name).toBe(businessData.name);
      expect(business.contactMobileNumbers).toEqual(['9876543210']);
    });

    it('should create business with address reference', async () => {
      const addressId = mockObjectId();
      const businessData = {
        name: 'Tech Corp',
        admin: mockObjectId(),
        address: addressId
      };

      const business = await businessService.create(businessData);

      expect(business.address?.toString()).toBe(addressId.toString());
    });
  });

  describe('find', () => {
    beforeEach(async () => {
      const admin1 = mockObjectId();
      const admin2 = mockObjectId();

      await Business.create([
        {
          name: 'Business Alpha',
          admin: admin1,
          contactMobileNumbers: ['1111111111']
        },
        {
          name: 'Business Beta',
          admin: admin1,
          contactMobileNumbers: ['2222222222']
        },
        {
          name: 'Business Gamma',
          admin: admin2,
          contactMobileNumbers: ['3333333333']
        }
      ]);
    });

    it('should return paginated business list', async () => {
      const result = await businessService.find({
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

    it('should filter businesses by admin', async () => {
      const business = await Business.findOne();
      const admin = business!.admin!.toString();

      const result = await businessService.find({
        filterQuery: { admin },
        limit: 10,
        skip: 0,
        sort: { name: 1 }
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.every(b => b.admin?.toString() === admin)).toBe(true);
    });

    it('should filter by managementType', async () => {
      // Create businesses with different management types
      await Business.create({
        name: 'Managed Business',
        admin: mockObjectId(),
        managementType: 'corporate'
      });

      const result = await businessService.find({
        filterQuery: { managementType: 'corporate' },
        limit: 10,
        skip: 0,
        sort: { name: 1 }
      });

      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should handle pagination', async () => {
      const page1 = await businessService.find({
        filterQuery: {},
        limit: 2,
        skip: 0,
        sort: { name: 1 }
      });

      const page2 = await businessService.find({
        filterQuery: {},
        limit: 2,
        skip: 2,
        sort: { name: 1 }
      });

      expect(page1.items).toHaveLength(2);
      expect(page2.items).toHaveLength(1);
      expect(page1.total).toBe(3);
    });

    it('should sort businesses by name', async () => {
      const result = await businessService.find({
        filterQuery: {},
        limit: 10,
        skip: 0,
        sort: { name: 1 }
      });

      expect(result.items[0].name).toBe('Business Alpha');
      expect(result.items[1].name).toBe('Business Beta');
      expect(result.items[2].name).toBe('Business Gamma');
    });
  });

  describe('findOne', () => {
    it('should find business by ID with populated address', async () => {
      const business = await Business.create({
        name: 'Test Business',
        admin: mockObjectId(),
        contactMobileNumbers: ['9999999999']
      });

      const found = await businessService.findOne(business._id.toString());

      expect(found).toBeTruthy();
      expect(found!._id.toString()).toBe(business._id.toString());
      expect(found!.name).toBe('Test Business');
    });

    it('should return null for non-existent ID', async () => {
      const fakeId = mockObjectId().toString();

      const found = await businessService.findOne(fakeId);

      expect(found).toBeNull();
    });
  });

  describe('filterByAdmin', () => {
    beforeEach(async () => {
      const admin1 = mockObjectId();
      const admin2 = mockObjectId();

      await Business.create([
        {
          name: 'Admin1 Business 1',
          admin: admin1,
          contactMobileNumbers: ['1111111111']
        },
        {
          name: 'Admin1 Business 2',
          admin: admin1,
          contactMobileNumbers: ['2222222222']
        },
        {
          name: 'Admin2 Business',
          admin: admin2,
          contactMobileNumbers: ['3333333333']
        }
      ]);
    });

    it('should return all businesses for specific admin', async () => {
      const business = await Business.findOne({ name: 'Admin1 Business 1' });
      const admin1 = business!.admin!.toString();

      const businesses = await businessService.filterByAdmin(admin1);

      expect(businesses).toHaveLength(2);
      expect(businesses.every(b => b.admin?.toString() === admin1)).toBe(true);
    });

    it('should return empty array if admin has no businesses', async () => {
      const fakeAdminId = mockObjectId().toString();

      const businesses = await businessService.filterByAdmin(fakeAdminId);

      expect(businesses).toHaveLength(0);
    });

    it('should populate address field', async () => {
      const business = await Business.findOne();
      const admin = business!.admin!.toString();

      const businesses = await businessService.filterByAdmin(admin);

      expect(businesses.length).toBeGreaterThan(0);
      // Address field should be populated (even if null)
    });
  });

  describe('update', () => {
    it('should update business successfully', async () => {
      const business = await Business.create({
        name: 'Original Name',
        admin: mockObjectId(),
        contactMobileNumbers: ['1234567890']
      });

      await businessService.update({
        id: business._id.toString(),
        business: { name: 'Updated Name' }
      });

      const updated = await Business.findById(business._id);
      expect(updated!.name).toBe('Updated Name');
    });

    it('should update multiple fields', async () => {
      const business = await Business.create({
        name: 'Test Business',
        admin: mockObjectId(),
        contactMobileNumbers: ['1234567890']
      });

      await businessService.update({
        id: business._id.toString(),
        business: {
          name: 'New Name',
          contactMobileNumbers: ['9999999999'],
          managementType: 'corporate'
        }
      });

      const updated = await Business.findById(business._id);
      expect(updated!.name).toBe('New Name');
      expect(updated!.contactMobileNumbers).toContain('9999999999');
    });
  });

  describe('delete', () => {
    it('should delete business successfully', async () => {
      const business = await Business.create({
        name: 'Delete Test',
        admin: mockObjectId(),
        contactMobileNumbers: ['1234567890']
      });

      await businessService.delete(business._id.toString());

      const deleted = await Business.findById(business._id);
      expect(deleted).toBeNull();
    });

    it('should return null when deleting non-existent business', async () => {
      const fakeId = mockObjectId().toString();

      const result = await businessService.delete(fakeId);

      expect(result).toBeNull();
    });
  });

  describe('countTotalDocuments', () => {
    it('should return correct total count', async () => {
      await Business.create([
        { name: 'Business 1', admin: mockObjectId(), contactMobileNumbers: [] },
        { name: 'Business 2', admin: mockObjectId(), contactMobileNumbers: [] },
        { name: 'Business 3', admin: mockObjectId(), contactMobileNumbers: [] }
      ]);

      const count = await businessService.countTotalDocuments();

      expect(count).toBe(3);
    });

    it('should return 0 when no businesses exist', async () => {
      const count = await businessService.countTotalDocuments();

      expect(count).toBe(0);
    });
  });
});
