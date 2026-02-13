/**
 * Dashboard Customization Model
 * Stores user-specific dashboard widget configurations
 * Phase 6: Admin Dashboard Enhancements
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IDashboardCustomization extends Document {
  userId: string;
  role: string;
  widgets: Array<{
    id: string;
    type: 'metric' | 'chart' | 'table' | 'alert-list';
    title: string;
    position: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
    config: any;
    permissions?: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const DashboardCustomizationSchema = new Schema<IDashboardCustomization>(
  {
    userId: {
      type: String,
      required: true,
      unique: true
      // unique: true automatically creates an index
    },
    role: {
      type: String,
      required: true
    },
    widgets: [
      {
        id: {
          type: String,
          required: true
        },
        type: {
          type: String,
          required: true,
          enum: ['metric', 'chart', 'table', 'alert-list']
        },
        title: {
          type: String,
          required: true
        },
        position: {
          x: { type: Number, required: true },
          y: { type: Number, required: true },
          w: { type: Number, required: true },
          h: { type: Number, required: true }
        },
        config: {
          type: Schema.Types.Mixed,
          required: true
        },
        permissions: [String]
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes
// userId index is created automatically by unique: true
DashboardCustomizationSchema.index({ role: 1 });

export const DashboardCustomization = mongoose.model<IDashboardCustomization>(
  'DashboardCustomization',
  DashboardCustomizationSchema
);
