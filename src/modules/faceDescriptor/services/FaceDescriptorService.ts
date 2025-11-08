import FaceDescriptor, { IFaceDescriptor } from "../models/FaceDescriptor";
import mongoose from "mongoose";

export class FaceDescriptorService {
  /**
   * Get all face descriptors for a business
   */
  getAllDescriptors = async (
    businessId: string,
    activeOnly: boolean = true
  ): Promise<any[]> => {
    const query: any = { business: businessId };

    if (activeOnly) {
      query.isActive = true;
    }

    return await FaceDescriptor.find(query)
      .sort({ updatedAt: -1 })
      .lean() as any[];
  };

  /**
   * Get face descriptors by staff ID
   */
  getDescriptorsByStaffId = async (
    staffId: string,
    activeOnly: boolean = true
  ): Promise<any[]> => {
    const query: any = { staffId };

    if (activeOnly) {
      query.isActive = true;
    }

    return await FaceDescriptor.find(query)
      .sort({ createdAt: -1 })
      .lean() as any[];
  };

  /**
   * Create or update face descriptor
   */
  upsertDescriptor = async (data: {
    id?: string;
    staffId: string;
    staffName: string;
    descriptor: number[];
    photoUrl?: string;
    business: string;
  }): Promise<IFaceDescriptor> => {
    // If ID provided, update existing
    if (data.id) {
      const existing = await FaceDescriptor.findById(data.id);
      if (existing) {
        existing.descriptor = data.descriptor;
        existing.staffName = data.staffName;
        if (data.photoUrl) {
          existing.photoUrl = data.photoUrl;
        }
        await existing.save();
        return existing;
      }
    }

    // Create new descriptor
    const descriptor = new FaceDescriptor({
      _id: data.id || new mongoose.Types.ObjectId(),
      staffId: data.staffId,
      staffName: data.staffName,
      descriptor: data.descriptor,
      photoUrl: data.photoUrl,
      business: data.business,
      isActive: true,
    });

    await descriptor.save();
    return descriptor;
  };

  /**
   * Deactivate face descriptor
   */
  deactivateDescriptor = async (descriptorId: string): Promise<void> => {
    await FaceDescriptor.findByIdAndUpdate(descriptorId, {
      isActive: false,
    });
  };

  /**
   * Delete face descriptor
   */
  deleteDescriptor = async (descriptorId: string): Promise<void> => {
    await FaceDescriptor.findByIdAndDelete(descriptorId);
  };

  /**
   * Get descriptors updated after a certain time
   */
  getDescriptorsUpdatedAfter = async (
    businessId: string,
    afterTimestamp: Date
  ): Promise<any[]> => {
    return await FaceDescriptor.find({
      business: businessId,
      updatedAt: { $gte: afterTimestamp },
    })
      .sort({ updatedAt: -1 })
      .lean() as any[];
  };

  /**
   * Get descriptor count for a business
   */
  getDescriptorCount = async (
    businessId: string,
    activeOnly: boolean = true
  ): Promise<number> => {
    const query: any = { business: businessId };
    
    if (activeOnly) {
      query.isActive = true;
    }

    return await FaceDescriptor.countDocuments(query);
  };
}

export default new FaceDescriptorService();
