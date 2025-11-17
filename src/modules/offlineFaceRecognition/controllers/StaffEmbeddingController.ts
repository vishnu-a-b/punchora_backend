import { Request, Response, NextFunction } from "express";
import StaffFaceEmbedding from "../models/StaffFaceEmbedding";
import OnnxFaceService from "../services/OnnxFaceService";
import StaffPhotoService from "../services/StaffPhotoService";
import mongoose from "mongoose";

/**
 * StaffEmbeddingController
 * Handles staff photo uploads, embedding generation, and sync endpoints
 *
 * IMPORTANT: This is separate from existing face-api.js controllers
 */

export class StaffEmbeddingController {
  /**
   * POST /v1/offline-face/upload-staff-photo
   * Upload staff photo, generate ONNX embedding, save both
   */
  uploadStaffPhoto = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { staffId, photo } = req.body;

      // Validate input
      if (!staffId || !photo) {
        return res.status(400).json({
          success: false,
          error: "staffId and photo (base64) are required",
        });
      }

      // Validate staffId is valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(staffId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid staffId format",
        });
      }

      // Save photo to local storage
      const photoPath = await StaffPhotoService.savePhotoFromBase64(
        photo,
        staffId
      );

      // Generate embedding using ONNX
      const embedding = await OnnxFaceService.generateEmbedding(photoPath);

      // Get photo URL
      const photoUrl = StaffPhotoService.getPhotoUrl(photoPath);

      // Check if embedding already exists for this staff
      const existingEmbedding = await StaffFaceEmbedding.findOne({ staffId });

      if (existingEmbedding) {
        // Update existing embedding
        existingEmbedding.embedding = embedding;
        existingEmbedding.photoUrl = photoUrl;
        existingEmbedding.updatedAt = new Date();
        await existingEmbedding.save();

        return res.status(200).json({
          success: true,
          message: "Staff face embedding updated successfully",
          data: {
            id: existingEmbedding._id,
            staffId: existingEmbedding.staffId,
            photoUrl: existingEmbedding.photoUrl,
            embeddingDimensions: embedding.length,
            updatedAt: existingEmbedding.updatedAt,
          },
        });
      }

      // Create new embedding record
      const newEmbedding = new StaffFaceEmbedding({
        staffId: new mongoose.Types.ObjectId(staffId),
        modelName: "MobileFaceNet",
        embedding,
        embeddingVersion: "v1.0",
        photoUrl,
      });

      await newEmbedding.save();

      res.status(201).json({
        success: true,
        message: "Staff face embedding created successfully",
        data: {
          id: newEmbedding._id,
          staffId: newEmbedding.staffId,
          photoUrl: newEmbedding.photoUrl,
          embeddingDimensions: embedding.length,
          createdAt: newEmbedding.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Error uploading staff photo:", error);
      next(error);
    }
  };

  /**
   * GET /v1/offline-face/staff-embeddings
   * Get all staff embeddings with pagination (for mobile sync)
   */
  getStaffEmbeddings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const lastSync = req.query.lastSync
        ? new Date(req.query.lastSync as string)
        : null;

      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};
      if (lastSync) {
        // Only get embeddings updated after lastSync
        query.updatedAt = { $gt: lastSync };
      }

      // Get embeddings with pagination
      const embeddings = await StaffFaceEmbedding.find(query)
        .populate("staffId", "name employeeId") // Populate staff details
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await StaffFaceEmbedding.countDocuments(query);

      // Transform response
      const data = embeddings.map((e: any) => ({
        id: e._id.toString(),
        staffId: e.staffId._id.toString(),
        staffName: e.staffId.name,
        employeeId: e.staffId.employeeId,
        embedding: e.embedding,
        photoUrl: e.photoUrl,
        modelName: e.modelName,
        embeddingVersion: e.embeddingVersion,
        updatedAt: e.updatedAt.getTime(),
      }));

      res.status(200).json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      });
    } catch (error: any) {
      console.error("Error getting staff embeddings:", error);
      next(error);
    }
  };

  /**
   * GET /v1/offline-face/staff-list
   * Get minimal staff list (id, name, photo) for offline app
   */
  getStaffList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const embeddings = await StaffFaceEmbedding.find({})
        .populate("staffId", "name employeeId")
        .sort({ updatedAt: -1 })
        .lean();

      const data = embeddings.map((e: any) => ({
        staffId: e.staffId._id.toString(),
        staffName: e.staffId.name,
        employeeId: e.staffId.employeeId,
        photoUrl: e.photoUrl,
        updatedAt: e.updatedAt.getTime(),
      }));

      res.status(200).json({
        success: true,
        data,
        total: data.length,
      });
    } catch (error: any) {
      console.error("Error getting staff list:", error);
      next(error);
    }
  };

  /**
   * DELETE /v1/offline-face/staff-embedding/:staffId
   * Delete staff embedding
   */
  deleteStaffEmbedding = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { staffId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(staffId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid staffId format",
        });
      }

      const embedding = await StaffFaceEmbedding.findOne({ staffId });

      if (!embedding) {
        return res.status(404).json({
          success: false,
          error: "Staff embedding not found",
        });
      }

      // Delete photo file
      try {
        const photoPath = embedding.photoUrl.replace(
          "/uploads/staff_face_photos/",
          ""
        );
        await StaffPhotoService.deletePhoto(photoPath);
      } catch (error) {
        console.warn("Failed to delete photo file:", error);
      }

      // Delete embedding
      await embedding.deleteOne();

      res.status(200).json({
        success: true,
        message: "Staff embedding deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting staff embedding:", error);
      next(error);
    }
  };
}

export default new StaffEmbeddingController();
