import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import StaffDepartmentService from "../services/StaffDepartmentService";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";

/**
 * PHASE 4: Multi-Department Controller
 * Handles staff department assignment operations
 */
export default class StaffDepartmentController extends BaseController {
  private service = new StaffDepartmentService();

  /**
   * Get all staff in a department
   * GET /v1/staff/department/:departmentId
   */
  getStaffInDepartment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { departmentId } = req.params;
      const { includeInactive } = req.query;

      const staff = await this.service.getStaffInDepartment(departmentId, {
        includeInactive: includeInactive === "true",
      });

      this.sendSuccessResponse(res, 200, {
        message: "Staff retrieved successfully",
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get staff's all departments
   * GET /v1/staff/:id/departments
   */
  getStaffDepartments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const departments = await this.service.getStaffDepartments(id);

      if (!departments) {
        throw new NotFoundError({ error: "Staff not found" });
      }

      this.sendSuccessResponse(res, 200, {
        message: "Staff departments retrieved successfully",
        data: departments,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add staff to additional department
   * POST /v1/staff/:id/departments
   */
  addStaffToDepartment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { departmentId } = req.body;

      if (!departmentId) {
        throw new BadRequestError({ error: "departmentId is required" });
      }

      const staff = await this.service.addStaffToDepartment(id, departmentId);

      this.sendSuccessResponse(res, 200, {
        message: "Staff added to department successfully",
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove staff from additional department
   * DELETE /v1/staff/:id/departments/:departmentId
   */
  removeStaffFromDepartment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id, departmentId } = req.params;

      const staff = await this.service.removeStaffFromDepartment(
        id,
        departmentId
      );

      this.sendSuccessResponse(res, 200, {
        message: "Staff removed from department successfully",
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change staff's primary department
   * PUT /v1/staff/:id/primary-department
   */
  changePrimaryDepartment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { departmentId } = req.body;

      if (!departmentId) {
        throw new BadRequestError({ error: "departmentId is required" });
      }

      const staff = await this.service.changePrimaryDepartment(
        id,
        departmentId
      );

      this.sendSuccessResponse(res, 200, {
        message: "Primary department changed successfully",
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get department staff counts
   * GET /v1/staff/departments/counts
   */
  getDepartmentStaffCounts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { business } = req.query;
      const businessFilter = (req as any).businessFilter;

      const counts = await this.service.getDepartmentStaffCounts(
        businessFilter || (business as string)
      );

      this.sendSuccessResponse(res, 200, {
        message: "Department staff counts retrieved successfully",
        data: counts,
      });
    } catch (error) {
      next(error);
    }
  };
}
