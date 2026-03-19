import FaceDescriptor, { IFaceDescriptor } from "../models/FaceDescriptor";
import mongoose from "mongoose";
import { FaceRecognitionService } from "../../../services/facialRecognitionservice";
import * as fs from "fs";
import * as path from "path";
import { AverageFaceDescriptor } from "../models/AverageFaceDescriptor";
import { Staff } from "../../staff/models/Staff";
import { User } from "../../user/models/User";
import Configs from "../../../configs/configs";

const RECOGNITION_THRESHOLD = 0.5; // euclidean distance (lower = stricter)

// Lazy singleton — only created on first face recognition request, not at startup
let _faceRecognitionService: FaceRecognitionService | null = null;
function getFaceRecognitionService(): FaceRecognitionService {
  if (!_faceRecognitionService) {
    _faceRecognitionService = new FaceRecognitionService();
  }
  return _faceRecognitionService;
}

export class FaceDescriptorService {
  /**
   * Get all face descriptors for a business
   */
  getAllDescriptors = async (
    // businessId: string,
    activeOnly: boolean = true
  ): Promise<any[]> => {
    const query: any = { };

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
   * Delete face descriptor — also deletes the linked photo file,
   * removes it from User.photos, and recalculates (or removes)
   * the AverageFaceDescriptor for that staff member.
   */
  deleteDescriptor = async (descriptorId: string): Promise<void> => {
    // 1. Fetch record so we have staffId and photoUrl before deleting
    const descriptor = await FaceDescriptor.findById(descriptorId);
    if (!descriptor) return;

    const { staffId, photoUrl } = descriptor;

    // 2. Delete the photo file from disk
    if (photoUrl) {
      try {
        const domain = Configs.domain || "";
        // URL format: "${domain}users/${filename}" → strip domain to get "users/filename"
        const relativePath = photoUrl.startsWith(domain)
          ? photoUrl.slice(domain.length)
          : photoUrl.replace(/^https?:\/\/[^/]+\//, "");
        const filePath = path.join(process.cwd(), "uploads", relativePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn("Failed to delete photo file:", err);
      }
    }

    // 3. Find the linked user via Staff and remove the photoUrl from User.photos
    const staff = await Staff.findById(staffId).lean();
    const userId = staff?.user;

    if (userId && photoUrl) {
      await User.findByIdAndUpdate(userId, { $pull: { photos: photoUrl } });
    }

    // 4. Delete the FaceDescriptor record
    await FaceDescriptor.findByIdAndDelete(descriptorId);

    // 5. Recalculate AverageFaceDescriptor from remaining active descriptors
    if (userId) {
      const remaining = await FaceDescriptor.find({ staffId, isActive: true });
      if (remaining.length > 0) {
        const descriptorArrays = remaining.map(
          (d: any) => new Float32Array(d.descriptor)
        );
        const avg = getFaceRecognitionService().averageDescriptors(descriptorArrays);
        await AverageFaceDescriptor.findOneAndUpdate(
          { user: userId },
          { descriptor: [...avg] },
          { upsert: true, new: true }
        );
      } else {
        // No descriptors left — remove average as well
        await AverageFaceDescriptor.deleteMany({ user: userId });
      }
    }
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
   * Recognize a person from an uploaded photo using face-api.js.
   * Returns best match from FaceDescriptor collection.
   */
  recognizeFromPhoto = async (
    imagePath: string,
    businessId?: string
  ): Promise<{
    staffId: string;
    staffName: string;
    confidence: number;
    photoUrl?: string;
  } | null> => {
    try {
      // Extract descriptor from the uploaded photo
      const descriptor = await getFaceRecognitionService().extractDescriptor(imagePath);

      // Fetch all active descriptors (optionally scoped to a business)
      const query: any = { isActive: true };
      if (businessId) query.business = businessId;
      const records = await FaceDescriptor.find(query).lean();

      if (records.length === 0) {
        return null;
      }

      let bestMatch: { staffId: string; staffName: string; distance: number; photoUrl?: string } | null = null;

      for (const record of records) {
        if (!record.descriptor || record.descriptor.length !== 128) continue;

        const storedDescriptor = new Float32Array(record.descriptor);
        // Euclidean distance (same as faceapi.euclideanDistance)
        let sum = 0;
        for (let i = 0; i < 128; i++) {
          const diff = descriptor[i] - storedDescriptor[i];
          sum += diff * diff;
        }
        const distance = Math.sqrt(sum);

        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = {
            staffId: record.staffId.toString(),
            staffName: record.staffName,
            distance,
            photoUrl: record.photoUrl,
          };
        }
      }

      if (!bestMatch || bestMatch.distance > RECOGNITION_THRESHOLD) {
        return null;
      }

      // Convert distance to confidence score (0-1, higher is better)
      const confidence = Math.max(0, 1 - bestMatch.distance / RECOGNITION_THRESHOLD);

      return {
        staffId: bestMatch.staffId,
        staffName: bestMatch.staffName,
        confidence,
        photoUrl: bestMatch.photoUrl,
      };
    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(imagePath);
      } catch {}
    }
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
