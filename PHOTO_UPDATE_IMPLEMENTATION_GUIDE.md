# Photo and Face Descriptor Update Implementation Guide

## Current State Analysis

### ✅ Already Implemented:
1. **Face descriptor deletion on photo update** (`User.ts:53-64`)
   - Pre-hook automatically deletes descriptors when photos change
2. **Face descriptor deletion on user delete** (`UserService.ts:85-88`)
3. **Face descriptor generation on create** (`UserController.ts:77-87`)
4. **FaceRecognitionService.createDescriptor()** method exists

### ❌ Missing:
1. **Face descriptor regeneration on photo update** in UserController
2. **Dedicated photo update endpoint**
3. **Admin dashboard photo upload UI**

---

## Backend Implementation

### 1. Update UserController - Add Descriptor Regeneration

**File:** `backend/src/modules/user/controllers/UserController.ts`

The `update` method needs to regenerate face descriptors after photo update.

#### Current update method (line 112-185):
```typescript
update = async (req: Request, res: Response, next: NextFunction) => {
  // ... existing code ...

  const user = await this.service.update(req.params.id, body);

  // ❌ Missing: Regenerate face descriptors if photos were updated

  this.sendSuccessResponse(res, 200, { data: { _id: user!._id } });
}
```

#### Enhanced update method:
```typescript
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

    // ✅ NEW: Regenerate face descriptors if photos were uploaded
    if (photoPaths.length > 0) {
      try {
        console.log(`Regenerating face descriptors for user ${user.id}`);
        await this.facialRecognitionService.createDescriptor(
          user.id,
          photoPaths
        );
        console.log(`Face descriptors regenerated successfully for user ${user.id}`);
      } catch (error) {
        console.error(`Failed to regenerate face descriptors: ${error}`);
        // Don't fail the update if descriptor generation fails
        // Admin can retry or user can re-upload photos
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
```

---

### 2. Add Dedicated Photo Update Endpoint

**File:** `backend/src/modules/user/controllers/UserController.ts`

Add a new method specifically for updating photos:

```typescript
/**
 * Update user photos and regenerate face descriptors
 * Dedicated endpoint for photo updates from admin dashboard
 */
updatePhotos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;

    if (!req.files) {
      throw new ValidationFailedError({
        error: "No photos provided"
      });
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    let photoUrls: string[] = [];
    let photoPaths: string[] = [];
    let profilePictureUrl: string | undefined;

    // Process face recognition photos
    if (files.photos) {
      files.photos.forEach((file) => {
        photoUrls.push(Configs.domain + "users/" + file.filename);
        photoPaths.push(file.path);
      });
    }

    // Process profile picture
    if (files.profilePicture?.[0]) {
      profilePictureUrl =
        Configs.domain + "users/" + files.profilePicture[0].filename;
    }

    // Prepare update body
    const updateBody: any = {};
    if (photoUrls.length > 0) {
      updateBody.photos = photoUrls;
    }
    if (profilePictureUrl) {
      updateBody.profilePicture = profilePictureUrl;
    }

    // Update user with new photos
    // This will trigger the pre-hook that deletes old face descriptors
    const user = await this.service.update(userId, updateBody);

    if (!user) {
      throw new NotFoundError({ error: "user not found" });
    }

    // Generate new face descriptors if face recognition photos were uploaded
    if (photoPaths.length > 0) {
      try {
        console.log(`Generating face descriptors for user ${userId}`);
        await this.facialRecognitionService.createDescriptor(
          userId,
          photoPaths
        );
        console.log(`Face descriptors generated successfully`);

        this.sendSuccessResponse(res, 200, {
          data: {
            _id: user._id,
            photos: photoUrls,
            profilePicture: profilePictureUrl,
            message: "Photos updated and face descriptors regenerated successfully"
          }
        });
      } catch (descriptorError: any) {
        console.error(`Face descriptor generation failed: ${descriptorError.message}`);

        // Return partial success - photos updated but descriptor generation failed
        this.sendSuccessResponse(res, 200, {
          data: {
            _id: user._id,
            photos: photoUrls,
            profilePicture: profilePictureUrl,
            warning: "Photos updated but face descriptor generation failed. Please ensure faces are clearly visible and try again.",
            error: descriptorError.message
          }
        });
      }
    } else {
      this.sendSuccessResponse(res, 200, {
        data: {
          _id: user._id,
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
```

---

### 3. Add Routes

**File:** `backend/src/modules/user/routes/UserRouter.ts`

Add new routes for photo management:

```typescript
import { Router } from "express";
import UserController from "../controllers/UserController";
import { upload } from "../../../middlewares/multer"; // Your existing multer config

const userRouter = Router();
const userController = new UserController();

// ... existing routes ...

/**
 * @route PUT /users/:id/photos
 * @desc Update user photos and regenerate face descriptors
 * @access Admin
 */
userRouter.put(
  "/:id/photos",
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "profilePicture", maxCount: 1 }
  ]),
  userController.updatePhotos
);

/**
 * @route DELETE /users/:id/photos
 * @desc Delete user photos and face descriptors
 * @access Admin
 */
userRouter.delete(
  "/:id/photos",
  userController.deletePhotos
);

export default userRouter;
```

---

### 4. Enhance FaceRecognitionService (Optional Improvement)

**File:** `backend/src/services/facialRecognitionservice.ts`

Add better error handling and logging:

```typescript
createDescriptor = async (user: string, images: string[]) => {
  try {
    console.log(`Creating descriptors for ${images.length} images`);

    const descriptors = [];
    const failedImages: string[] = [];

    for (const image of images) {
      try {
        const img = await canvas.loadImage(image);
        const detection = await faceapi
          .detectSingleFace(img as any)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          console.warn(`No face detected in image: ${image}`);
          failedImages.push(image);
          continue;
        }

        console.log(`Face detected successfully in: ${image}`);
        descriptors.push(detection.descriptor);
      } catch (imageError) {
        console.error(`Error processing image ${image}:`, imageError);
        failedImages.push(image);
      }
    }

    if (descriptors.length === 0) {
      throw new Error(
        `No faces detected in any of the ${images.length} images. ` +
        `Please ensure photos show clear, frontal faces.`
      );
    }

    if (failedImages.length > 0) {
      console.warn(
        `Failed to process ${failedImages.length} out of ${images.length} images`
      );
    }

    const averageDescriptor = this.averageDescriptors(descriptors);

    await AverageFaceDescriptor.create({
      user,
      descriptor: averageDescriptor,
    });

    console.log(
      `Successfully created face descriptor from ${descriptors.length} images ` +
      `(${failedImages.length} failed)`
    );

    return {
      success: true,
      processedImages: descriptors.length,
      totalImages: images.length,
      failedImages: failedImages.length
    };
  } catch (error) {
    console.error("Face registration failed:", error);
    throw error; // Throw to let caller handle
  }
};
```

---

## API Endpoints Summary

### 1. Update User (Enhanced)
```
PUT /users/:id
Content-Type: multipart/form-data

Fields:
- name, mobileNo, email, etc. (existing fields)
- photos[] (multiple files) - Face recognition photos
- profilePicture (single file) - Display picture

Response:
{
  "success": true,
  "data": {
    "_id": "user_id",
    "message": "User updated and face descriptors regenerated"
  }
}
```

### 2. Update Photos Only (NEW)
```
PUT /users/:id/photos
Content-Type: multipart/form-data

Fields:
- photos[] (multiple files) - Face recognition photos
- profilePicture (single file) - Display picture

Response:
{
  "success": true,
  "data": {
    "_id": "user_id",
    "photos": ["url1", "url2"],
    "profilePicture": "url",
    "message": "Photos updated and face descriptors regenerated successfully"
  }
}
```

### 3. Delete Photos (NEW)
```
DELETE /users/:id/photos
Content-Type: application/json

Body:
{
  "deleteProfilePicture": true,
  "deleteRecognitionPhotos": true
}

Response:
{
  "success": true,
  "data": {
    "_id": "user_id",
    "message": "Photos deleted successfully. Face descriptors have been removed."
  }
}
```

---

## Testing Backend Changes

### Test 1: Update Photos
```bash
curl -X PUT http://localhost:3002/users/USER_ID/photos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photos=@face1.jpg" \
  -F "photos=@face2.jpg" \
  -F "profilePicture=@profile.jpg"
```

### Test 2: Verify Descriptors Deleted and Recreated
```javascript
// Before update
db.averagefacedescriptors.find({ user: ObjectId("USER_ID") })
// Should show old descriptor

// After update
db.averagefacedescriptors.find({ user: ObjectId("USER_ID") })
// Should show new descriptor with new createdAt timestamp
```

### Test 3: Delete Photos
```bash
curl -X DELETE http://localhost:3002/users/USER_ID/photos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deleteProfilePicture": true, "deleteRecognitionPhotos": true}'
```

### Test 4: Verify Descriptors Deleted
```javascript
db.averagefacedescriptors.find({ user: ObjectId("USER_ID") })
// Should return empty
```

---

## How It Works

### Photo Update Flow:
```
1. Admin uploads new photos via dashboard
   ↓
2. PUT /users/:id/photos endpoint receives request
   ↓
3. Photos saved to server disk
   ↓
4. User.findByIdAndUpdate() called with new photo URLs
   ↓
5. Pre-hook triggered: AverageFaceDescriptor.deleteMany({ user: userId })
   ↓
6. Old face descriptors deleted from database
   ↓
7. FaceRecognitionService.createDescriptor() called
   ↓
8. Face detection runs on each new photo
   ↓
9. Descriptors extracted and averaged
   ↓
10. New AverageFaceDescriptor created in database
   ↓
11. Response sent to admin dashboard
```

### Photo Delete Flow:
```
1. Admin clicks delete photos
   ↓
2. DELETE /users/:id/photos endpoint receives request
   ↓
3. User.findByIdAndUpdate() with photos: []
   ↓
4. Pre-hook triggered: AverageFaceDescriptor.deleteMany({ user: userId })
   ↓
5. Face descriptors deleted from database
   ↓
6. Response sent to admin dashboard
```

---

## Error Handling

### Case 1: No Face Detected
```typescript
{
  "success": true,
  "data": {
    "warning": "Photos updated but face descriptor generation failed. Please ensure faces are clearly visible and try again.",
    "error": "No faces detected in any of the 3 images"
  }
}
```

### Case 2: Partial Success
```typescript
{
  "success": true,
  "data": {
    "message": "Photos updated. 2 out of 3 faces detected successfully."
  }
}
```

### Case 3: Invalid User ID
```typescript
{
  "success": false,
  "error": "invalid user_id"
}
```

---

## Database Cleanup on Delete

The deletion is already properly implemented:

**UserService.delete()** (line 85-88):
```typescript
delete = async (id: any) => {
  await FaceDescriptor.deleteMany({ user: id }); // Wrong model - should be AverageFaceDescriptor
  return await User.findByIdAndDelete(id);
};
```

**Fix:**
```typescript
delete = async (id: any) => {
  await AverageFaceDescriptor.deleteMany({ user: id }); // Correct model
  return await User.findByIdAndDelete(id);
};
```

---

## Next Steps

1. ✅ Implement backend changes (above)
2. ⏳ Test with Postman/curl
3. ⏳ Build admin dashboard UI (separate document)
4. ⏳ Test end-to-end flow
5. ⏳ Deploy to production

---

## Important Notes

⚠️ **Photo Storage**: Ensure you have enough disk space for photos

⚠️ **Face Detection**: Works best with:
- Clear, frontal face images
- Good lighting
- No sunglasses or masks
- High resolution (at least 640x480)

⚠️ **Performance**: Descriptor generation takes ~1-2 seconds per photo

⚠️ **Backup**: Old photos are overwritten. Consider backup strategy if needed.
