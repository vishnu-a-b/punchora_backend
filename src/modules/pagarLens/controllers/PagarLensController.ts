import { Request, Response } from "express";
import PagarLensService from "../services/PagarLensService";

class PagarLensController {
  private service: PagarLensService;

  constructor() {
    this.service = new PagarLensService();
  }

  /**
   * GET /v1/pagar-lens/descriptors
   * Query params: page, limit, lastSync, business
   */
  getDescriptors = async (req: Request, res: Response): Promise<void> => {
    try {
      const businessId = (req.query.business as string) || (req.user as any)?.business;

      if (!businessId) {
        res.status(400).json({ success: false, error: "business is required" });
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const lastSync = (req.query.lastSync as string) || undefined;

      const result = await this.service.getDescriptors(businessId, page, limit, lastSync);

      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("[PagarLensController.getDescriptors]", err);
      res.status(500).json({ success: false, error: err.message ?? "Internal server error" });
    }
  };

  /**
   * POST /v1/pagar-lens/attendance
   * Body: { records: AttendanceRecord[] }
   */
  syncAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { records } = req.body;

      if (!Array.isArray(records) || records.length === 0) {
        res.status(400).json({ success: false, error: "records array is required and must not be empty" });
        return;
      }

      const userId = (req.user as any)?._id?.toString() ?? "unknown";
      const result = await this.service.syncAttendance(records, userId);

      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("[PagarLensController.syncAttendance]", err);
      const status = err.message?.includes("Batch size") ? 400 : 500;
      res.status(status).json({ success: false, error: err.message ?? "Internal server error" });
    }
  };
}

export default new PagarLensController();
