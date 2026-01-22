import { Activity, ActivityStatus, IActivity } from "../models/Activity";
import mongoose from "mongoose";

export interface CreateActivityDTO {
  staff: string;
  business: string;
  department?: string;
  type: string;
  startTime?: Date;
  location?: string;
  reason?: string;
  photo?: string;
  meterReadingStart?: number;
  vehiclePhoto?: string;
  gpsLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export interface EndActivityDTO {
  endTime?: Date;
  meterReadingEnd?: number;
}

export default class ActivityService {
  /**
   * Start a new activity
   */
  async startActivity(data: CreateActivityDTO): Promise<IActivity> {
    const activity = new Activity({
      ...data,
      status: ActivityStatus.STARTED,
      startTime: data.startTime || new Date()
    });

    await activity.save();
    return activity;
  }

  /**
   * End an ongoing activity
   */
  async endActivity(
    activityId: string,
    data: EndActivityDTO
  ): Promise<IActivity> {
    const activity = await Activity.findById(activityId);

    if (!activity) {
      throw new Error("Activity not found");
    }

    if (activity.status === ActivityStatus.ENDED) {
      throw new Error("Activity already ended");
    }

    activity.status = ActivityStatus.ENDED;
    activity.endTime = data.endTime || new Date();

    if (data.meterReadingEnd) {
      activity.meterReadingEnd = data.meterReadingEnd;
    }

    // Duration will be calculated by pre-save hook
    await activity.save();

    return activity;
  }

  /**
   * Get staff activities
   * PHASE 5: Added .lean() optimization
   */
  async getStaffActivities(
    staffId: string,
    options: {
      skip?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      type?: string;
      status?: string;
    } = {}
  ): Promise<{ items: IActivity[]; total: number }> {
    const query: any = { staff: staffId };

    if (options.startDate || options.endDate) {
      query.startTime = {};
      if (options.startDate) {
        query.startTime.$gte = options.startDate;
      }
      if (options.endDate) {
        query.startTime.$lte = options.endDate;
      }
    }

    if (options.type) {
      query.type = options.type;
    }

    if (options.status) {
      query.status = options.status;
    }

    const [items, total] = await Promise.all([
      Activity.find(query)
        .sort({ startTime: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 100)
        .populate("staff", "name")
        .populate("department", "name")
        .lean(),
      Activity.countDocuments(query),
    ]);

    return { items: items as any, total };
  }

  /**
   * Get ongoing activities for a staff member
   * PHASE 5: Added .lean() optimization
   */
  async getOngoingActivities(staffId: string): Promise<IActivity[]> {
    return Activity.find({
      staff: staffId,
      status: ActivityStatus.STARTED,
    })
      .sort({ startTime: -1 })
      .populate("staff", "name")
      .populate("department", "name")
      .lean() as any;
  }

  /**
   * Get activity by ID
   * PHASE 5: Added .lean() optimization
   */
  async getActivityById(activityId: string): Promise<IActivity | null> {
    return Activity.findById(activityId)
      .populate("staff", "name email")
      .populate("business", "name")
      .populate("department", "name")
      .lean() as any;
  }

  /**
   * Get business activities (for admin)
   * PHASE 5: Added .lean() optimization
   */
  async getBusinessActivities(
    businessId: string,
    options: {
      skip?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      type?: string;
      departmentId?: string;
    } = {}
  ): Promise<{ items: IActivity[]; total: number }> {
    const query: any = { business: businessId };

    if (options.startDate || options.endDate) {
      query.startTime = {};
      if (options.startDate) {
        query.startTime.$gte = options.startDate;
      }
      if (options.endDate) {
        query.startTime.$lte = options.endDate;
      }
    }

    if (options.type) {
      query.type = options.type;
    }

    if (options.departmentId) {
      query.department = options.departmentId;
    }

    const [items, total] = await Promise.all([
      Activity.find(query)
        .sort({ startTime: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 100)
        .populate("staff", "name")
        .populate("department", "name")
        .lean(),
      Activity.countDocuments(query),
    ]);

    return { items: items as any, total };
  }

  /**
   * Delete activity
   */
  async deleteActivity(activityId: string): Promise<boolean> {
    const result = await Activity.deleteOne({ _id: activityId });
    return result.deletedCount > 0;
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(
    staffId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const stats = await Activity.aggregate([
      {
        $match: {
          staff: new mongoose.Types.ObjectId(staffId),
          startTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalDuration: { $sum: "$duration" }
        }
      }
    ]);

    return stats;
  }
}
