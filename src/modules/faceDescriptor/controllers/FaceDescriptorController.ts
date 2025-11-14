import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import FaceDescriptorService from "../services/FaceDescriptorService";

export class FaceDescriptorController extends BaseController {
  constructor(private service: typeof FaceDescriptorService) {
    super();
  }

  /**
   * Get all face descriptors for a business
   */
  getAllDescriptors = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { business } = req.query;

      // if (!business) {
      //   return res.status(400).json({
      //     success: false,
      //     error: "Business ID is required",
      //   });
      // }

      const descriptors = await this.service.getAllDescriptors(
        // business as string,
        false  // Return all descriptors, not just active ones
      );

      // Transform to API format
      const data = descriptors.map((d: any) => ({
        id: d._id ? d._id.toString() : '',
        staffId: d.staffId ? d.staffId.toString() : '',
        staffName: d.staffName || '',
        descriptor: d.descriptor || [],
        photoUrl: d.photoUrl || '',
        createdAt: d.createdAt ? new Date(d.createdAt).getTime() : Date.now(),
        updatedAt: d.updatedAt ? new Date(d.updatedAt).getTime() : Date.now(),
      }));

      this.sendSuccessResponse(res, 200, { data });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create or update face descriptor
   */
  upsertDescriptor = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id, staffId, staffName, descriptor, photoUrl } = req.body;
      const business = req.query.business || req.body.business;

      // Validate required fields
      if (!staffId || !staffName || !descriptor || !business) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: staffId, staffName, descriptor, business",
        });
      }

      // Validate descriptor length
      if (!Array.isArray(descriptor) || descriptor.length !== 128) {
        return res.status(400).json({
          success: false,
          error: "Descriptor must be a 128-dimensional array",
        });
      }

      const result = await this.service.upsertDescriptor({
        id,
        staffId,
        staffName,
        descriptor,
        photoUrl,
        business: business as string,
      });

      this.sendSuccessResponse(res, id ? 200 : 201, {
        data: {
          id: (result._id as any).toString(),
          staffId: (result.staffId as any).toString(),
          staffName: result.staffName,
          photoUrl: result.photoUrl,
          createdAt: result.createdAt.getTime(),
          updatedAt: result.updatedAt.getTime(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete face descriptor
   */
  deleteDescriptor = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Descriptor ID is required",
        });
      }

      await this.service.deleteDescriptor(id);

      this.sendSuccessResponse(res, 200, {
        data: { message: "Face descriptor deleted successfully" },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get descriptor count
   */
  getDescriptorCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { business } = req.query;

      if (!business) {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      const count = await this.service.getDescriptorCount(
        business as string,
        true
      );

      this.sendSuccessResponse(res, 200, { data: { count } });
    } catch (error) {
      next(error);
    }
  };
}

export default new FaceDescriptorController(FaceDescriptorService);
