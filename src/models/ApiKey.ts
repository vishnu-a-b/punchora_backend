/**
 * API Key Model
 * For secure API access without user sessions
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IApiKey extends Document {
  key: string;
  name: string;
  business: mongoose.Types.ObjectId;
  permissions: string[];
  active: boolean;
  expiresAt?: Date;
  lastUsed?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  hasPermission(permission: string): boolean;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    key: {
      type: String,
      required: true,
      unique: true
      // Index created in composite index below (line 81)
    },
    name: {
      type: String,
      required: true,
      maxLength: 100
    },
    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true
      // Index created in composite index below (line 82)
    },
    permissions: [
      {
        type: String,
        enum: [
          'read:staff',
          'write:staff',
          'read:attendance',
          'write:attendance',
          'read:reports',
          'read:alerts',
          'write:alerts',
          'read:activities',
          'write:activities',
          'admin:all'
        ]
      }
    ],
    active: {
      type: Boolean,
      default: true
      // Index created in composite indexes below
    },
    expiresAt: {
      type: Date
      // No standalone index needed
    },
    lastUsed: {
      type: Date
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient lookups
ApiKeySchema.index({ key: 1, active: 1 });
ApiKeySchema.index({ business: 1, active: 1 });

// Method to check if key is expired
ApiKeySchema.methods.isExpired = function(): boolean {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to check if user has permission
ApiKeySchema.methods.hasPermission = function(permission: string): boolean {
  return this.permissions.includes('admin:all') || this.permissions.includes(permission);
};

export const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
