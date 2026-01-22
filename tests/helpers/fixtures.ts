/**
 * Test Fixtures
 * Reusable test data and mocks
 */

import mongoose from 'mongoose';

/**
 * Generate a mock MongoDB ObjectId
 */
export const mockObjectId = (id?: string): mongoose.Types.ObjectId => {
  if (id && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return new mongoose.Types.ObjectId();
};

/**
 * Mock Staff Data
 */
export const mockStaffData = {
  _id: mockObjectId(),
  name: 'John Doe',
  uid: '12345',
  email: 'john.doe@example.com',
  phone: '1234567890',
  business: mockObjectId(),
  department: mockObjectId(),
  isActive: true,
  role: 'staff',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Mock Business Data
 */
export const mockBusinessData = {
  _id: mockObjectId(),
  name: 'Acme Corp',
  contactEmail: 'admin@acme.com',
  contactPhone: '9876543210',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Mock Department Data
 */
export const mockDepartmentData = {
  _id: mockObjectId(),
  name: 'Engineering',
  business: mockObjectId(),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Mock Attendance Data
 */
export const mockAttendanceData = {
  _id: mockObjectId(),
  staff: mockObjectId(),
  date: new Date('2026-01-21'),
  checkInTime: new Date('2026-01-21T09:00:00Z'),
  checkOutTime: new Date('2026-01-21T17:00:00Z'),
  checkInLocation: {
    latitude: 12.9716,
    longitude: 77.5946,
    accuracy: 10,
    mocked: false,
    timestamp: Date.now()
  },
  checkOutLocation: {
    latitude: 12.9716,
    longitude: 77.5946,
    accuracy: 10,
    mocked: false,
    timestamp: Date.now()
  },
  status: 'checked-out',
  flagged: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Mock Activity Data
 */
export const mockActivityData = {
  _id: mockObjectId(),
  staff: mockObjectId(),
  business: mockObjectId(),
  department: mockObjectId(),
  type: 'tea-break',
  status: 'started',
  startTime: new Date('2026-01-21T10:00:00Z'),
  endTime: null,
  reason: 'Regular tea break',
  gpsLocation: {
    latitude: 12.9716,
    longitude: 77.5946,
    accuracy: 10
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Mock Alert Data
 */
export const mockAlertData = {
  _id: mockObjectId(),
  type: 'mocked_gps',
  severity: 'high',
  staff: mockObjectId(),
  business: mockObjectId(),
  department: mockObjectId(),
  title: 'GPS Spoofing Detected',
  message: 'Mocked GPS location detected during check-in',
  metadata: {
    location: {
      latitude: 12.9716,
      longitude: 77.5946
    },
    timestamp: new Date()
  },
  status: 'active',
  priority: 4,
  acknowledged: false,
  resolved: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Mock Offline Sync Record
 */
export const mockOfflineAttendanceRecord = {
  localId: 'offline-123',
  staffId: mockObjectId().toString(),
  type: 'check-in',
  timestamp: new Date('2026-01-21T09:00:00Z').getTime(),
  location: {
    latitude: 12.9716,
    longitude: 77.5946,
    accuracy: 10,
    mocked: false
  },
  photo: 'base64-encoded-photo-data',
  deviceInfo: {
    platform: 'ios',
    version: '17.0'
  }
};

/**
 * Mock User Data
 */
export const mockUserData = {
  _id: mockObjectId(),
  email: 'user@example.com',
  password: 'hashedPassword123',
  role: 'staff',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Mock SyncBatch Data
 */
export const mockSyncBatchData = {
  _id: mockObjectId(),
  batchId: 'batch-123',
  userId: mockObjectId(),
  totalRecords: 5,
  processedRecords: 5,
  failedRecords: 0,
  status: 'completed',
  errorSummary: [],
  startTime: new Date(),
  endTime: new Date(),
  duration: 1000,
  createdAt: new Date(),
  updatedAt: new Date()
};
