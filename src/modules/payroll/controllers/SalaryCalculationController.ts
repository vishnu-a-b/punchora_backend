import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import BaseController from "../../base/controllers.ts/BaseController";
import { SalaryCalculation } from "../models/SalaryCalculation";
import { initializeCalculation } from "../services/SalaryCalculationService";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";

export default class SalaryCalculationController extends BaseController {
  // POST /v1/payroll/preview — compute rows without saving
  preview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessId, periodStart, periodEnd, coolOffMinutes, holidays } = req.body;
      if (!businessId || !periodStart || !periodEnd) {
        throw new BadRequestError({ error: "businessId, periodStart and periodEnd are required" });
      }

      const rows = await initializeCalculation({
        businessId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        coolOffMinutes: Number(coolOffMinutes) || 5,
        holidays: (holidays || []).map((d: string) => new Date(d)),
      });

      this.sendSuccessResponse(res, 200, { data: { rows } });
    } catch (e) {
      next(e);
    }
  };

  // POST /v1/payroll/ — create and save draft
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessId, periodStart, periodEnd, coolOffMinutes, holidays, label } = req.body;
      if (!businessId || !periodStart || !periodEnd) {
        throw new BadRequestError({ error: "businessId, periodStart and periodEnd are required" });
      }

      const rows = await initializeCalculation({
        businessId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        coolOffMinutes: Number(coolOffMinutes) || 5,
        holidays: (holidays || []).map((d: string) => new Date(d)),
      });

      const calc = await SalaryCalculation.create({
        business: businessId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        label: label || "",
        coolOffMinutes: Number(coolOffMinutes) || 5,
        holidays: (holidays || []).map((d: string) => new Date(d)),
        createdBy: (req as any).user?._id,
        rows,
      });

      this.sendSuccessResponse(res, 201, { data: calc });
    } catch (e) {
      next(e);
    }
  };

  // GET /v1/payroll/ — paginated list
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { businessId, limit = 20, skip = 0 } = req.query as any;

      // Business scoping: super-admin passes businessId; others get it from middleware
      const businessFilter = businessId || (req as any).businessFilter?.business;
      if (!businessFilter) {
        throw new BadRequestError({ error: "businessId is required" });
      }

      const query = { business: businessFilter };
      const [items, total] = await Promise.all([
        SalaryCalculation.find(query)
          .select("-rows") // exclude rows for list view
          .sort({ periodStart: -1 })
          .skip(Number(skip))
          .limit(Number(limit))
          .lean(),
        SalaryCalculation.countDocuments(query),
      ]);

      this.sendSuccessResponseList(res, 200, {
        data: { items, total, limit: Number(limit), skip: Number(skip) },
      });
    } catch (e) {
      next(e);
    }
  };

  // GET /v1/payroll/:id — single record with full rows
  getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const calc = await SalaryCalculation.findById(req.params.id).lean();
      if (!calc) throw new NotFoundError({ error: "Salary calculation not found" });
      this.sendSuccessResponse(res, 200, { data: calc });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "Invalid id" }));
        return;
      }
      next(e);
    }
  };

  // PUT /v1/payroll/:id — patch overrides / custom columns
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const calc = await SalaryCalculation.findById(req.params.id);
      if (!calc) throw new NotFoundError({ error: "Salary calculation not found" });
      if (calc.status === "finalized") {
        throw new BadRequestError({ error: "Cannot edit a finalized calculation" });
      }

      const { rows, customColumns, label } = req.body;

      if (label !== undefined) calc.label = label;

      if (customColumns !== undefined) {
        calc.customColumns = customColumns;
      }

      if (rows && Array.isArray(rows)) {
        rows.forEach((incoming: any) => {
          const existingRow = calc.rows.find(
            (r: any) => r.staff.toString() === incoming.staffId
          );
          if (!existingRow) return;

          if (incoming.overrides) {
            Object.entries(incoming.overrides).forEach(([k, v]) => {
              existingRow.overrides.set(k, v as number);
            });
          }
          if (incoming.customValues) {
            Object.entries(incoming.customValues).forEach(([k, v]) => {
              existingRow.customValues.set(k, v as number);
            });
          }
          if (incoming.notes) {
            Object.entries(incoming.notes).forEach(([k, v]) => {
              existingRow.notes.set(k, v as string);
            });
          }
        });
      }

      await calc.save();
      this.sendSuccessResponse(res, 200, { data: calc });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "Invalid id" }));
        return;
      }
      next(e);
    }
  };

  // PUT /v1/payroll/:id/recalculate — re-run initializeCalculation, preserve overrides
  recalculate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const calc = await SalaryCalculation.findById(req.params.id);
      if (!calc) throw new NotFoundError({ error: "Salary calculation not found" });
      if (calc.status === "finalized") {
        throw new BadRequestError({ error: "Cannot recalculate a finalized calculation" });
      }

      const freshRows = await initializeCalculation({
        businessId: calc.business.toString(),
        periodStart: new Date(calc.periodStart),
        periodEnd: new Date(calc.periodEnd),
        coolOffMinutes: calc.coolOffMinutes ?? 5,
        holidays: (calc.holidays ?? []).map((d: any) => new Date(d)),
      });

      // Preserve each row's overrides/customValues/notes from the existing calculation
      const existingMap = new Map(
        calc.rows.map((r: any) => [r.staff.toString(), r])
      );

      // splice + push so Mongoose DocumentArray tracks the mutation correctly
      calc.rows.splice(0, calc.rows.length);
      for (const freshRow of freshRows) {
        const existing = existingMap.get(freshRow.staff.toString());
        calc.rows.push({
          ...freshRow,
          overrides:    existing?.overrides    ?? new Map(),
          customValues: existing?.customValues ?? new Map(),
          notes:        existing?.notes        ?? new Map(),
        } as any);
      }

      calc.markModified("rows");
      await calc.save();
      this.sendSuccessResponse(res, 200, { data: calc });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "Invalid id" }));
        return;
      }
      next(e);
    }
  };

  // PUT /v1/payroll/:id/finalize
  finalize = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const calc = await SalaryCalculation.findByIdAndUpdate(
        req.params.id,
        { status: "finalized" },
        { new: true }
      );
      if (!calc) throw new NotFoundError({ error: "Salary calculation not found" });
      this.sendSuccessResponse(res, 200, { data: calc });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "Invalid id" }));
        return;
      }
      next(e);
    }
  };

  // DELETE /v1/payroll/:id — only draft
  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const calc = await SalaryCalculation.findById(req.params.id);
      if (!calc) throw new NotFoundError({ error: "Salary calculation not found" });
      if (calc.status === "finalized") {
        throw new BadRequestError({ error: "Cannot delete a finalized calculation" });
      }
      await calc.deleteOne();
      this.sendSuccessResponse(res, 200, { data: { deleted: true } });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "Invalid id" }));
        return;
      }
      next(e);
    }
  };
}
