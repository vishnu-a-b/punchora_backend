/**
 * Staff Department Service
 *
 * PHASE 4: Multi-Department Support
 * Handles operations related to staff department assignments
 */

import { Staff } from "../models/Staff";
import mongoose from "mongoose";

export default class StaffDepartmentService {
  /**
   * Get all staff in a department (primary OR additional)
   */
  async getStaffInDepartment(
    departmentId: string,
    options: { includeInactive?: boolean } = {}
  ): Promise<any[]> {
    const query: any = {
      $or: [
        { department: departmentId },
        { additionalDepartments: departmentId },
      ],
    };

    if (!options.includeInactive) {
      query.isActive = true;
    }

    return Staff.find(query)
      .populate("user", "name email")
      .populate("department", "name")
      .populate("additionalDepartments", "name")
      .populate("business", "name")
      .exec();
  }

  /**
   * Get staff's all departments
   */
  async getStaffDepartments(staffId: string): Promise<any> {
    const staff = await Staff.findById(staffId)
      .populate("department", "name")
      .populate("additionalDepartments", "name");

    if (!staff) {
      return null;
    }

    return {
      primary: staff.department,
      additional: staff.additionalDepartments || [],
      all: (staff as any).allDepartments, // Virtual field
    };
  }

  /**
   * Add staff to additional department
   */
  async addStaffToDepartment(
    staffId: string,
    departmentId: string
  ): Promise<any> {
    const staff = await Staff.findById(staffId);

    if (!staff) {
      throw new Error("Staff not found");
    }

    await (staff as any).addToDepartment(departmentId);

    return Staff.findById(staffId)
      .populate("department", "name")
      .populate("additionalDepartments", "name");
  }

  /**
   * Remove staff from additional department
   */
  async removeStaffFromDepartment(
    staffId: string,
    departmentId: string
  ): Promise<any> {
    const staff = await Staff.findById(staffId);

    if (!staff) {
      throw new Error("Staff not found");
    }

    await (staff as any).removeFromDepartment(departmentId);

    return Staff.findById(staffId)
      .populate("department", "name")
      .populate("additionalDepartments", "name");
  }

  /**
   * Change staff's primary department
   */
  async changePrimaryDepartment(
    staffId: string,
    newPrimaryDepartmentId: string
  ): Promise<any> {
    const staff = await Staff.findById(staffId);

    if (!staff) {
      throw new Error("Staff not found");
    }

    const oldPrimary = staff.department;

    // Update primary department
    staff.department = new mongoose.Types.ObjectId(newPrimaryDepartmentId);

    // Remove new primary from additional departments if present
    if (staff.additionalDepartments && staff.additionalDepartments.length > 0) {
      staff.additionalDepartments = staff.additionalDepartments.filter(
        (dept: any) => dept.toString() !== newPrimaryDepartmentId
      );
    }

    // Optionally add old primary to additional departments
    // (commented out - can be enabled based on business logic)
    // if (oldPrimary && !staff.additionalDepartments) {
    //   staff.additionalDepartments = [];
    // }
    // if (oldPrimary) {
    //   staff.additionalDepartments.push(oldPrimary);
    // }

    await staff.save();

    return Staff.findById(staffId)
      .populate("department", "name")
      .populate("additionalDepartments", "name");
  }

  /**
   * Check if staff belongs to department
   */
  async staffBelongsToDepartment(
    staffId: string,
    departmentId: string
  ): Promise<boolean> {
    const staff = await Staff.findById(staffId);

    if (!staff) {
      return false;
    }

    return (staff as any).belongsToDepartment(departmentId);
  }

  /**
   * Get departments for multiple staff members
   */
  async getBulkStaffDepartments(staffIds: string[]): Promise<Map<string, any>> {
    const staffList = await Staff.find({ _id: { $in: staffIds } })
      .populate("department", "name")
      .populate("additionalDepartments", "name");

    const result = new Map();

    staffList.forEach((staff) => {
      result.set(staff._id.toString(), {
        primary: staff.department,
        additional: staff.additionalDepartments || [],
        all: (staff as any).allDepartments,
      });
    });

    return result;
  }

  /**
   * Get count of staff per department (including additional)
   */
  async getDepartmentStaffCounts(businessId?: string): Promise<any[]> {
    const matchQuery: any = { isActive: true };
    if (businessId) {
      matchQuery.business = new mongoose.Types.ObjectId(businessId);
    }

    // Count primary departments
    const primaryCounts = await Staff.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$department", primaryCount: { $sum: 1 } } },
    ]);

    // Count additional departments
    const additionalCounts = await Staff.aggregate([
      { $match: matchQuery },
      { $unwind: { path: "$additionalDepartments", preserveNullAndEmptyArrays: false } },
      { $group: { _id: "$additionalDepartments", additionalCount: { $sum: 1 } } },
    ]);

    // Combine results
    const countsMap = new Map();

    primaryCounts.forEach((item) => {
      countsMap.set(item._id.toString(), {
        department: item._id,
        primaryCount: item.primaryCount,
        additionalCount: 0,
        totalCount: item.primaryCount,
      });
    });

    additionalCounts.forEach((item) => {
      const deptId = item._id.toString();
      if (countsMap.has(deptId)) {
        const existing = countsMap.get(deptId);
        existing.additionalCount = item.additionalCount;
        existing.totalCount += item.additionalCount;
      } else {
        countsMap.set(deptId, {
          department: item._id,
          primaryCount: 0,
          additionalCount: item.additionalCount,
          totalCount: item.additionalCount,
        });
      }
    });

    return Array.from(countsMap.values());
  }
}
