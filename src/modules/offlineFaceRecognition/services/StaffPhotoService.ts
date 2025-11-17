import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

/**
 * StaffPhotoService
 * Handles staff photo uploads for ONNX-based face recognition
 *
 * IMPORTANT: Uses a separate folder from existing photo storage
 * Photos stored in: uploads/staff_face_photos/
 */

export class StaffPhotoService {
  private static instance: StaffPhotoService;
  private uploadDir: string;

  private constructor() {
    // Use a different folder from existing photo storage
    this.uploadDir = path.join(
      process.cwd(),
      "uploads",
      "staff_face_photos"
    );
    this.ensureUploadDirExists();
  }

  public static getInstance(): StaffPhotoService {
    if (!StaffPhotoService.instance) {
      StaffPhotoService.instance = new StaffPhotoService();
    }
    return StaffPhotoService.instance;
  }

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDirExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      console.log(`✅ Created upload directory: ${this.uploadDir}`);
    }
  }

  /**
   * Save photo from base64 string
   * Returns local file path
   */
  async savePhotoFromBase64(
    base64Data: string,
    staffId: string
  ): Promise<string> {
    try {
      // Remove data URL prefix if present
      const base64Image = base64Data.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      const buffer = Buffer.from(base64Image, "base64");

      // Generate unique filename
      const filename = `${staffId}_${randomUUID()}.jpg`;
      const filePath = path.join(this.uploadDir, filename);

      // Process and save image (resize, optimize)
      await sharp(buffer)
        .resize(800, 800, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 90 })
        .toFile(filePath);

      console.log(`✅ Saved staff photo: ${filename}`);
      return filePath;
    } catch (error) {
      console.error("Error saving photo from base64:", error);
      throw new Error("Failed to save staff photo");
    }
  }

  /**
   * Save photo from file upload (multer)
   * Returns local file path
   */
  async savePhotoFromUpload(
    file: Express.Multer.File,
    staffId: string
  ): Promise<string> {
    try {
      // Generate unique filename
      const filename = `${staffId}_${randomUUID()}.jpg`;
      const filePath = path.join(this.uploadDir, filename);

      // Process and save image (resize, optimize)
      await sharp(file.buffer)
        .resize(800, 800, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 90 })
        .toFile(filePath);

      console.log(`✅ Saved staff photo: ${filename}`);
      return filePath;
    } catch (error) {
      console.error("Error saving uploaded photo:", error);
      throw new Error("Failed to save staff photo");
    }
  }

  /**
   * Delete photo file
   */
  async deletePhoto(photoPath: string): Promise<void> {
    try {
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
        console.log(`✅ Deleted photo: ${photoPath}`);
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      throw new Error("Failed to delete staff photo");
    }
  }

  /**
   * Get public URL for photo
   * (Adjust this based on your server configuration)
   */
  getPhotoUrl(photoPath: string): string {
    // Return relative path or full URL based on your setup
    const filename = path.basename(photoPath);
    return `/uploads/staff_face_photos/${filename}`;
  }

  /**
   * Validate image file
   */
  validateImageFile(file: Express.Multer.File): boolean {
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(
        "Invalid file type. Only JPEG and PNG images are allowed."
      );
    }

    if (file.size > maxSize) {
      throw new Error("File size exceeds 10MB limit.");
    }

    return true;
  }
}

export default StaffPhotoService.getInstance();
