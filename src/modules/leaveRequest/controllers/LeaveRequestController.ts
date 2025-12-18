import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import mongoose from "mongoose";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import LeaveRequestService from "../services/LeaveRequestService";
import { LeaveRequest } from "../models/LeaveRequest";
import { LeaveStatus } from "../../base/enums/leaveStatus";
import { UserRole } from "../../../constants/roles";

export default class LeaveRequestController extends BaseController {
  service = new LeaveRequestService();
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        next(new ValidationFailedError({ errors: errors.array() }));
        return;
      }

      const request = await this.service.createLeaveRequest(req.body);

      this.sendSuccessResponse(res, 201, { data: request });
    } catch (e: any) {
      next(e);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, skip, search } = req.query;
      const { filterQuery, sort } = req;
      const data = await this.service.find({
        limit: Number(limit),
        skip: Number(skip),
        filterQuery,
        sort,
      });

      this.sendSuccessResponseList(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        next(new ValidationFailedError({ errors: errors.array() }));
        return;
      }

      const request = await LeaveRequest.findById(req.params.id);
      if (!request) {
        throw new Error("No leave request found");
      }
      if (request.status !== LeaveStatus.pending.toString()) {
        throw new Error("Not permitted to edit this request");
      }

      const { reason, leaveDates } = req.body;

      const leave = await this.service.update({
        id: req.params.id,
        data: { reason, leaveDates },
      });
      if (!leave) {
        throw new NotFoundError({ error: "leave request not found" });
      }
      this.sendSuccessResponse(res, 200, { data: { _id: leave!._id } });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid leave_request_id" }));
      }
      next(e);
    }
  };

  accept = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        next(new ValidationFailedError({ errors: errors.array() }));
        return;
      }

      const request = await LeaveRequest.findById(req.params.id);
      if (!request) {
        throw new Error("No leave request found");
      }
      if (request.status !== LeaveStatus.pending.toString()) {
        throw new Error("Not permitted to edit this request");
      }

      const { status, remarks } = req.body;

      const leave = await this.service.validateLeaveRequest({
        id: req.params.id,
        data: { status, remarks },
      });
      if (!leave) {
        throw new NotFoundError({ error: "leave request not found" });
      }
      this.sendSuccessResponse(res, 200, { data: { _id: leave!._id } });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid leave request_id" }));
      }
      next(e);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await LeaveRequest.findById(req.params.id);
      if (!request) {
        throw new Error("No leave request found");
      }
      if (request.status !== LeaveStatus.pending.toString()) {
        throw new Error("Not permitted to delete this request");
      }
      const leave = await this.service.delete(req.params.id);
      if (!leave) {
        throw new NotFoundError({ error: "leave request not found" });
      }
      this.sendSuccessResponse(res, 204, { data: {} });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid leave_request_id" }));
      }
      next(e);
    }
  };

  /**
   * Get pending approvals filtered by role
   */
  getPendingApprovals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      let query: any = {};

      if (user.role === UserRole.DEPARTMENT_HEAD) {
        // Get staff IDs in this department
        const Staff = mongoose.model('Staff');
        const staffInDept = await Staff.find({ department: user.department }).select('_id');
        const staffIds = staffInDept.map((s: any) => s._id);

        query = {
          staff: { $in: staffIds },
          status: LeaveStatus.pending
        };
      } else if (user.role === UserRole.HR_ADMIN) {
        // Get leaves pending HR approval
        query = {
          status: LeaveStatus.pending_hr_approval
        };
      } else {
        // Business/Super admin can see all
        query = {
          status: { $in: [LeaveStatus.pending, LeaveStatus.pending_hr_approval] }
        };
      }

      const leaves = await LeaveRequest.find(query)
        .populate('staff', 'name email')
        .populate('department', 'name')
        .sort({ createdAt: -1 })
        .limit(100);

      this.sendSuccessResponse(res, 200, { data: leaves });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Department Head approves leave (Level 1)
   */
  approveLeaveDeptHead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const user = (req as any).user;

      const leave = await LeaveRequest.findById(id).populate('staff');
      if (!leave) {
        throw new NotFoundError({ error: 'Leave request not found' });
      }

      if (leave.status !== LeaveStatus.pending) {
        throw new BadRequestError({ error: 'Leave is not in pending status' });
      }

      // Check department access for dept heads
      if (user.role === UserRole.DEPARTMENT_HEAD) {
        const staff = leave.staff as any;
        if (staff.department?.toString() !== user.department?.toString()) {
          throw new BadRequestError({ error: 'You can only approve leaves for your department' });
        }
      }

      leave.departmentHeadApproval = {
        approvedBy: user._id,
        approvedAt: new Date(),
        status: 'approved',
        comments: comments || ''
      };
      leave.status = LeaveStatus.pending_hr_approval;
      await leave.save();

      this.sendSuccessResponse(res, 200, {
        message: 'Leave approved by department head, pending HR approval',
        data: leave
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Department Head rejects leave (Level 1)
   */
  rejectLeaveDeptHead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const user = (req as any).user;

      const leave = await LeaveRequest.findById(id).populate('staff');
      if (!leave) {
        throw new NotFoundError({ error: 'Leave request not found' });
      }

      if (leave.status !== LeaveStatus.pending) {
        throw new BadRequestError({ error: 'Leave is not in pending status' });
      }

      // Check department access for dept heads
      if (user.role === UserRole.DEPARTMENT_HEAD) {
        const staff = leave.staff as any;
        if (staff.department?.toString() !== user.department?.toString()) {
          throw new BadRequestError({ error: 'You can only reject leaves for your department' });
        }
      }

      leave.departmentHeadApproval = {
        approvedBy: user._id,
        approvedAt: new Date(),
        status: 'rejected',
        comments: comments || ''
      };
      leave.status = LeaveStatus.rejected_by_dept_head;
      await leave.save();

      this.sendSuccessResponse(res, 200, {
        message: 'Leave rejected by department head',
        data: leave
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * HR approves leave (Level 2)
   */
  approveLeaveHR = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const user = (req as any).user;

      const leave = await LeaveRequest.findById(id);
      if (!leave) {
        throw new NotFoundError({ error: 'Leave request not found' });
      }

      if (leave.status !== LeaveStatus.pending_hr_approval) {
        throw new BadRequestError({ error: 'Leave is not pending HR approval' });
      }

      leave.hrApproval = {
        approvedBy: user._id,
        approvedAt: new Date(),
        status: 'approved',
        comments: comments || ''
      };
      leave.status = LeaveStatus.approved;
      await leave.save();

      this.sendSuccessResponse(res, 200, {
        message: 'Leave approved by HR',
        data: leave
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * HR rejects leave (Level 2)
   */
  rejectLeaveHR = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const user = (req as any).user;

      const leave = await LeaveRequest.findById(id);
      if (!leave) {
        throw new NotFoundError({ error: 'Leave request not found' });
      }

      if (leave.status !== LeaveStatus.pending_hr_approval) {
        throw new BadRequestError({ error: 'Leave is not pending HR approval' });
      }

      leave.hrApproval = {
        approvedBy: user._id,
        approvedAt: new Date(),
        status: 'rejected',
        comments: comments || ''
      };
      leave.status = LeaveStatus.rejected_by_hr;
      await leave.save();

      this.sendSuccessResponse(res, 200, {
        message: 'Leave rejected by HR',
        data: leave
      });
    } catch (error) {
      next(error);
    }
  };
}
