import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import UserService from "../services/UserService";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import mongoose from "mongoose";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import Configs from "../../../configs/configs";
import { User } from "../models/User";
import { createPasswordHash } from "../../authentication/utils/createPasswordHash";
import { FaceRecognitionService } from "../../../services/facialRecognitionservice";
import { FaceDescriptor } from "../../faceDescriptor/models/FaceDescriptor";
import { AverageFaceDescriptor } from "../../faceDescriptor/models/AverageFaceDescriptor";
import { Staff } from "../../staff/models/Staff";

export default class UserController extends BaseController {
  service = new UserService();
  facialRecognitionService = new FaceRecognitionService();

  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, skip, search } = req.query;
      const { filterQuery, sort } = req;
      const data = await this.service.list({
        limit: Number(limit),
        skip: Number(skip),
        filterQuery,
        sort,
      });
      this.sendSuccessResponseList(res, 200, { data });
    } catch (e) {
      next(e);
    }
  };

  filterByRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, skip, search } = req.query;
      const { filterQuery, sort } = req;
      const data = await this.service.filterByRole(req.params.slug, {
        limit: Number(limit),
        skip: Number(skip),
        filterQuery,
        sort,
      });
      this.sendSuccessResponseList(res, 200, { data });
    } catch (e) {
      next(e);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        next(new ValidationFailedError({ errors: errors.array() }));
        return;
      }
      let photoUrls: any[] = [];
      if (req.files) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        if (files.photos) {
          files.photos.forEach((file) => {
            photoUrls.push(Configs.domain + "users/" + file.filename);
          });
          req.body.photos = photoUrls;
        }
        if (files.profilePicture?.[0]) {
          req.body.profilePicture =
            Configs.domain + "users/" + files.profilePicture?.[0].filename;
        }
      }

      const user = await this.service.create(req.body);
      if (req.files) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        if (files.photos) {
          this.facialRecognitionService.createDescriptor(
            user.id,
            files.photos.map((photo) => photo.path)
          );
        }
      }
      this.sendSuccessResponse(res, 201, { data: user });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid data" }));
      }
      next(e);
    }
  };

  getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.findOne(req.params.id);
      if (!user) {
        throw new NotFoundError({ error: "user not found" });
      }
      this.sendSuccessResponse(res, 200, { data: user });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid user_id" }));
      }
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
      let photoUrls: any[] = [];
      let photoPaths: string[] = []; // NEW: Store file paths for descriptor generation

      if (req.files) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        if (files.photos) {
          files.photos.forEach((file) => {
            photoUrls.push(Configs.domain + "users/" + file.filename);
            photoPaths.push(file.path); // NEW: Collect file paths
          });
          req.body.photos = photoUrls;
        }
        if (files.profilePicture?.[0]) {
          req.body.profilePicture =
            Configs.domain + "users/" + files.profilePicture?.[0].filename;
        }
      }
      if (req.body.mobileNo) {
        const availableUser = await User.findOne({
          mobileNo: req.body.mobileNo,
        });
        if (availableUser && availableUser.id != req.params.id) {
          next(
            new ValidationFailedError({
              errors: ["user with this mobile number already exists"],
            })
          );
          return;
        }
      }

      const {
        name,
        mobileNo,
        email,
        dateOfBirth,
        gender,
        maritalStatus,
        roles,
        isActive,
        password,
      } = req.body;
      const body: any = {
        name,
        mobileNo,
        password: password ? await createPasswordHash(password) : undefined,
        email,
        dateOfBirth,
        gender,
        maritalStatus,
        roles,
        isActive,
      };

      if (req.body.photos) {
        body.photos = req.body.photos;
      }

      if (req.body.profilePicture) {
        body.profilePicture = req.body.profilePicture;
      }

      const user = await this.service.update(req.params.id, body);
      if (!user) {
        throw new NotFoundError({ error: "user not found" });
      }

      // NEW: Regenerate face descriptors if photos were uploaded
      if (photoPaths.length > 0) {
        try {
          console.log(`Regenerating face descriptors for user ${user.id}`);
          await this.facialRecognitionService.createDescriptor(
            user.id,
            photoPaths
          );
          console.log(`Face descriptors regenerated successfully for user ${user.id}`);
        } catch (error) {
          console.error(`Failed to regenerate face descriptors:`, error);
          // Don't fail the update if descriptor generation fails
        }
      }

      this.sendSuccessResponse(res, 200, {
        data: {
          _id: user!._id,
          message: photoPaths.length > 0
            ? "User updated and face descriptors regenerated"
            : "User updated"
        }
      });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid user_id" }));
      }
      next(e);
    }
  };

  updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        next(new ValidationFailedError({ errors: errors.array() }));
        return;
      }
      const { oldPassword, newPassword } = req.body;
      const user = await this.service.updatePassword(
        req.params.id,
        oldPassword,
        newPassword
      );
      this.sendSuccessResponse(res, 200, { data: { _id: user!._id } });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid user_id" }));
      }
      next(e);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.delete(req.params.id);
      if (!user) {
        throw new NotFoundError({ error: "user not found" });
      }
      this.sendSuccessResponse(res, 204, { data: {} });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid user id" }));
      }
      next(e);
    }
  };

  /**
   * Update user photos and regenerate face descriptors
   * Dedicated endpoint for photo updates from admin dashboard
   * Supports: add photos, replace all photos, remove specific photos
   */
  updatePhotos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;

      // Get current user data
      const currentUser = await this.service.findOne(userId);
      if (!currentUser) {
        throw new NotFoundError({ error: "user not found" });
      }

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      // Parse operation mode from body (default: add to existing)
      const replaceAll = req.body.replaceAll === "true" || req.body.replaceAll === true;
      const removePhotoUrls: string[] = req.body.removePhotoUrls
        ? (typeof req.body.removePhotoUrls === 'string'
            ? JSON.parse(req.body.removePhotoUrls)
            : req.body.removePhotoUrls)
        : [];

      let newPhotoUrls: string[] = [];
      let newPhotoPaths: string[] = [];
      let profilePictureUrl: string | undefined;

      // Process new face recognition photos
      if (files && files.photos) {
        files.photos.forEach((file) => {
          newPhotoUrls.push(Configs.domain + "users/" + file.filename);
          newPhotoPaths.push(file.path);
        });
      }

      // Process profile picture
      if (files && files.profilePicture?.[0]) {
        profilePictureUrl =
          Configs.domain + "users/" + files.profilePicture[0].filename;
      }

      // Build final photos array
      let finalPhotos: string[] = [];
      const updateBody: any = {};

      if (newPhotoUrls.length > 0) {
        if (replaceAll) {
          // Replace all photos
          finalPhotos = newPhotoUrls;
        } else {
          // Add to existing photos
          const existingPhotos = currentUser.photos || [];
          finalPhotos = [...existingPhotos, ...newPhotoUrls];
        }
        updateBody.photos = finalPhotos;
      } else if (removePhotoUrls.length > 0) {
        // Remove specific photos
        const existingPhotos = currentUser.photos || [];
        finalPhotos = existingPhotos.filter(
          (photo: string) => !removePhotoUrls.includes(photo)
        );
        updateBody.photos = finalPhotos;
      }

      if (profilePictureUrl) {
        updateBody.profilePicture = profilePictureUrl;
      }

      // Only update if there are changes
      if (Object.keys(updateBody).length === 0) {
        throw new ValidationFailedError({
          error: "No photos provided or no changes requested"
        });
      }

      // Update user with new photos
      // This will trigger the pre-hook that deletes old face descriptors
      const user = await this.service.update(userId, updateBody);

      // Generate new face descriptors if face recognition photos were changed
      const facesChanged = newPhotoUrls.length > 0 || removePhotoUrls.length > 0;

      if (facesChanged) {
        try {
          console.log(`Regenerating face descriptors for user ${userId}`);

          // Get all current photo paths for descriptor generation
          // We need actual file paths, not URLs
          // For now, use only new photos for descriptor generation
          if (newPhotoPaths.length > 0) {
            await this.facialRecognitionService.createDescriptor(
              userId,
              newPhotoPaths
            );
            console.log(`Face descriptors regenerated successfully`);
          }

          this.sendSuccessResponse(res, 200, {
            data: {
              _id: user!._id,
              photos: updateBody.photos,
              profilePicture: profilePictureUrl || currentUser.profilePicture,
              message: newPhotoUrls.length > 0
                ? `${replaceAll ? 'Replaced' : 'Added'} ${newPhotoUrls.length} photo(s) and regenerated face descriptors`
                : `Removed ${removePhotoUrls.length} photo(s) and regenerated face descriptors`
            }
          });
        } catch (descriptorError: any) {
          console.error(`Face descriptor generation failed: ${descriptorError.message}`);

          // Return partial success - photos updated but descriptor generation failed
          this.sendSuccessResponse(res, 200, {
            data: {
              _id: user!._id,
              photos: updateBody.photos,
              profilePicture: profilePictureUrl || currentUser.profilePicture,
              warning: "Photos updated but face descriptor generation failed. Please ensure faces are clearly visible and try again.",
              error: descriptorError.message
            }
          });
        }
      } else {
        // Only profile picture updated
        this.sendSuccessResponse(res, 200, {
          data: {
            _id: user!._id,
            profilePicture: profilePictureUrl,
            message: "Profile picture updated successfully"
          }
        });
      }
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid user_id" }));
      }
      next(e);
    }
  };

  /**
   * Delete user photos and face descriptors
   */
  deletePhotos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      const { deleteProfilePicture, deleteRecognitionPhotos } = req.body;

      const updateBody: any = {};

      if (deleteRecognitionPhotos) {
        updateBody.photos = [];
        // This will trigger the pre-hook that deletes face descriptors
      }

      if (deleteProfilePicture) {
        updateBody.profilePicture = null;
      }

      const user = await this.service.update(userId, updateBody);

      if (!user) {
        throw new NotFoundError({ error: "user not found" });
      }

      this.sendSuccessResponse(res, 200, {
        data: {
          _id: user._id,
          message: "Photos deleted successfully. Face descriptors have been removed."
        }
      });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid user_id" }));
      }
      next(e);
    }
  };

  /**
   * Update profile picture only — does NOT affect face descriptors
   */
  updateProfilePicture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files || !files.profilePicture?.[0]) {
        throw new ValidationFailedError({ error: "No profile picture provided" });
      }

      const profilePictureUrl = Configs.domain + "users/" + files.profilePicture[0].filename;

      // Only profilePicture updated — photos field not touched, descriptors unaffected
      const user = await User.findByIdAndUpdate(
        userId,
        { profilePicture: profilePictureUrl },
        { new: true }
      );
      if (!user) throw new NotFoundError({ error: "user not found" });

      this.sendSuccessResponse(res, 200, {
        data: { _id: user._id, profilePicture: profilePictureUrl, message: "Profile picture updated" },
      });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid user_id" }));
      }
      next(e);
    }
  };

  /**
   * Add or remove individual recognition photos.
   * Adding a photo → extract descriptor → create FaceDescriptor entry.
   * Removing a photo → delete matching FaceDescriptor.
   * Recalculates AverageFaceDescriptor after any change.
   */
  updateRecognitionPhotos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;

      const currentUser = await this.service.findOne(userId);
      if (!currentUser) throw new NotFoundError({ error: "user not found" });

      const staff = await Staff.findOne({ user: userId });
      if (!staff) throw new NotFoundError({ error: "staff record not found for this user" });

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const removePhotoUrls: string[] = req.body.removePhotoUrls
        ? (typeof req.body.removePhotoUrls === "string"
            ? JSON.parse(req.body.removePhotoUrls)
            : req.body.removePhotoUrls)
        : [];

      let currentPhotos: string[] = currentUser.photos || [];

      // Remove specified photos and their descriptors
      if (removePhotoUrls.length > 0) {
        await FaceDescriptor.deleteMany({ staffId: staff._id, photoUrl: { $in: removePhotoUrls } });
        currentPhotos = currentPhotos.filter((p: string) => !removePhotoUrls.includes(p));
      }

      // Add new photos and generate a descriptor per photo
      if (files && files.photos && files.photos.length > 0) {
        for (const file of files.photos) {
          const photoUrl = Configs.domain + "users/" + file.filename;
          currentPhotos.push(photoUrl);
          try {
            const descriptor = await this.facialRecognitionService.extractDescriptor(file.path);
            await FaceDescriptor.create({
              staffId: staff._id,
              staffName: staff.name,
              descriptor: [...descriptor],
              photoUrl,
              business: staff.business,
              isActive: true,
            });
          } catch (err: any) {
            console.error(`Descriptor extraction failed for ${photoUrl}:`, err.message);
          }
        }
      }

      // Persist updated photos array (profilePicture not touched)
      await User.findByIdAndUpdate(userId, { photos: currentPhotos });

      // Recalculate AverageFaceDescriptor from all remaining active descriptors
      const allDescriptors = await FaceDescriptor.find({ staffId: staff._id, isActive: true });
      if (allDescriptors.length > 0) {
        const descriptorArrays = allDescriptors.map((d: any) => new Float32Array(d.descriptor));
        const avg = this.facialRecognitionService.averageDescriptors(descriptorArrays);
        await AverageFaceDescriptor.findOneAndUpdate(
          { user: userId },
          { descriptor: [...avg] },
          { upsert: true, new: true }
        );
      } else {
        await AverageFaceDescriptor.deleteMany({ user: userId });
      }

      this.sendSuccessResponse(res, 200, {
        data: { _id: userId, photos: currentPhotos, message: "Recognition photos updated" },
      });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid user_id" }));
      }
      next(e);
    }
  };

  // createAverageFaceDescriptors = async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     const users = await User.find().limit(1000);
  //     let completedUsers = 0;
  //     for (const user of users) {
  //       console.log("user", user.name);
  //       const descriptors = await FaceDescriptor.find({ user: user.id });
  //       if(descriptors.length>0) {
  //         console.log("got descriptors", descriptors.length);
  //         const averageDescriptor = this.averageDescriptors(
  //           descriptors.map((des) => new Float32Array(des.descriptor))
  //         );
  //         console.log("average descriptor");
  //         console.log(averageDescriptor);
  //         try {
  //           await AverageFaceDescriptor.create({
  //             user: user.id,
  //             descriptor: [...averageDescriptor],
  //           });
  //           console.log("average descriptor created");
  //           completedUsers = completedUsers + 1;
  //         } catch (e) {
  //           console.log("creation error");
  //         }
  //       }

  //     }
  //     this.sendSuccessResponse(res, 204, { data: { total: completedUsers } });
  //   } catch (e: any) {
  //     next(e);
  //   }
  // };
}
