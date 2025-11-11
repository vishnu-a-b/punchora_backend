# Photo Management API - User Guide

## Overview
The photo management API now supports **granular photo operations**:
- ✅ **Add** photos to existing collection
- ✅ **Replace** all photos at once
- ✅ **Remove** specific photos by URL
- ✅ **Update** profile picture independently

---

## Endpoint: `PUT /users/:id/photos`

### Base URL
```
PUT http://localhost:3002/v1/users/:id/photos
```

---

## Use Cases

### 1. **Add New Photos (Keep Existing)**
Adds new photos to the existing collection without removing old ones.

**Example:** User has 4 photos, you upload 1 new photo → Result: 5 photos

```bash
curl -X PUT http://localhost:3002/v1/users/USER_ID/photos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photos=@new_photo.jpg"
```

**Request:**
```
Content-Type: multipart/form-data

photos: [new_photo.jpg]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "photos": [
      "http://localhost:3002/users/old_photo1.jpg",
      "http://localhost:3002/users/old_photo2.jpg",
      "http://localhost:3002/users/old_photo3.jpg",
      "http://localhost:3002/users/old_photo4.jpg",
      "http://localhost:3002/users/new_photo.jpg"
    ],
    "message": "Added 1 photo(s) and regenerated face descriptors"
  }
}
```

---

### 2. **Replace ALL Photos**
Removes all existing photos and replaces them with new ones.

**Example:** User has 4 photos, you upload 2 new photos with replaceAll → Result: 2 photos

```bash
curl -X PUT http://localhost:3002/v1/users/USER_ID/photos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg" \
  -F "replaceAll=true"
```

**Request:**
```
Content-Type: multipart/form-data

photos: [photo1.jpg, photo2.jpg]
replaceAll: true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "photos": [
      "http://localhost:3002/users/photo1.jpg",
      "http://localhost:3002/users/photo2.jpg"
    ],
    "message": "Replaced 2 photo(s) and regenerated face descriptors"
  }
}
```

---

### 3. **Remove Specific Photos**
Removes specific photos by providing their URLs.

**Example:** User has 4 photos, you remove 2 → Result: 2 photos

```bash
curl -X PUT http://localhost:3002/v1/users/USER_ID/photos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "removePhotoUrls": [
      "http://localhost:3002/users/old_photo2.jpg",
      "http://localhost:3002/users/old_photo3.jpg"
    ]
  }'
```

**Request:**
```json
{
  "removePhotoUrls": [
    "http://localhost:3002/users/old_photo2.jpg",
    "http://localhost:3002/users/old_photo3.jpg"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "photos": [
      "http://localhost:3002/users/old_photo1.jpg",
      "http://localhost:3002/users/old_photo4.jpg"
    ],
    "message": "Removed 2 photo(s) and regenerated face descriptors"
  }
}
```

---

### 4. **Update Profile Picture Only**
Updates the profile picture without affecting face recognition photos.

```bash
curl -X PUT http://localhost:3002/v1/users/USER_ID/photos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "profilePicture=@new_profile.jpg"
```

**Request:**
```
Content-Type: multipart/form-data

profilePicture: new_profile.jpg
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "profilePicture": "http://localhost:3002/users/new_profile.jpg",
    "message": "Profile picture updated successfully"
  }
}
```

---

### 5. **Add Photos + Update Profile Picture**
You can do both operations at once.

```bash
curl -X PUT http://localhost:3002/v1/users/USER_ID/photos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photos=@face_photo1.jpg" \
  -F "photos=@face_photo2.jpg" \
  -F "profilePicture=@new_profile.jpg"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "photos": ["url1", "url2", "url3", "url4", "new_url1", "new_url2"],
    "profilePicture": "http://localhost:3002/users/new_profile.jpg",
    "message": "Added 2 photo(s) and regenerated face descriptors"
  }
}
```

---

## Request Parameters

### Multipart Form Data Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `photos` | File[] | No | New face recognition photos to add/replace |
| `profilePicture` | File | No | New profile picture |
| `replaceAll` | Boolean | No | If true, replaces all existing photos. Default: false (adds to existing) |
| `removePhotoUrls` | String[] | No | Array of photo URLs to remove |

---

## Important Notes

### Face Descriptor Behavior:

⚠️ **Current Limitation:** When you add new photos, the face descriptor is regenerated using **only the new photos**, not all photos (old + new).

**Why?**
- New photos have file paths available
- Old photos only have URLs in database (file paths not stored)
- Face recognition needs actual image file paths

**Workaround:**
If you need descriptors from ALL photos:
1. Use `replaceAll=true` and re-upload all photos
2. Or: Store all photo file paths in database (requires schema change)

### When Descriptors Regenerate:

✅ Descriptors regenerate when:
- New face recognition photos added
- Photos removed
- Photos replaced

❌ Descriptors **don't** regenerate when:
- Only profile picture updated (profile picture not used for face recognition)

---

## Error Handling

### No Changes Provided
```json
{
  "success": false,
  "error": "No photos provided or no changes requested"
}
```

### Face Detection Failed
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "photos": ["url1", "url2"],
    "warning": "Photos updated but face descriptor generation failed. Please ensure faces are clearly visible and try again.",
    "error": "No faces detected in any of the 2 images"
  }
}
```

### Invalid User ID
```json
{
  "success": false,
  "error": "invalid user_id"
}
```

---

## Admin Dashboard Integration

### React/Next.js Example:

```typescript
// Add new photos
const addPhotos = async (userId: string, files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('photos', file);
  });

  const response = await fetch(`http://localhost:3002/v1/users/${userId}/photos`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return response.json();
};

// Replace all photos
const replaceAllPhotos = async (userId: string, files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('photos', file);
  });
  formData.append('replaceAll', 'true');

  const response = await fetch(`http://localhost:3002/v1/users/${userId}/photos`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return response.json();
};

// Remove specific photos
const removePhotos = async (userId: string, photoUrls: string[]) => {
  const response = await fetch(`http://localhost:3002/v1/users/${userId}/photos`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      removePhotoUrls: photoUrls
    })
  });

  return response.json();
};

// Update profile picture only
const updateProfilePicture = async (userId: string, file: File) => {
  const formData = new FormData();
  formData.append('profilePicture', file);

  const response = await fetch(`http://localhost:3002/v1/users/${userId}/photos`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return response.json();
};
```

---

## Testing Examples

### Test 1: Add 1 Photo to Existing 4 Photos
```bash
# Before: User has 4 photos
curl http://localhost:3002/v1/users/USER_ID

# Add 1 photo
curl -X PUT http://localhost:3002/v1/users/USER_ID/photos \
  -H "Authorization: Bearer TOKEN" \
  -F "photos=@new_photo.jpg"

# After: User should have 5 photos
curl http://localhost:3002/v1/users/USER_ID
```

### Test 2: Remove 2 Photos from 4 Photos
```bash
# Get current photos
curl http://localhost:3002/v1/users/USER_ID

# Copy 2 photo URLs from response, then remove them
curl -X PUT http://localhost:3002/v1/users/USER_ID/photos \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "removePhotoUrls": [
      "http://localhost:3002/users/photo2.jpg",
      "http://localhost:3002/users/photo3.jpg"
    ]
  }'

# After: User should have 2 photos
curl http://localhost:3002/v1/users/USER_ID
```

### Test 3: Replace All 4 Photos with 2 New Photos
```bash
curl -X PUT http://localhost:3002/v1/users/USER_ID/photos \
  -H "Authorization: Bearer TOKEN" \
  -F "photos=@new1.jpg" \
  -F "photos=@new2.jpg" \
  -F "replaceAll=true"

# After: User should have exactly 2 photos (the new ones)
```

---

## Summary

| Operation | Command | Result |
|-----------|---------|--------|
| Add photos | Upload photos (no replaceAll) | Old photos + new photos |
| Replace all | Upload photos + replaceAll=true | Only new photos |
| Remove specific | Send removePhotoUrls array | Remaining photos |
| Update profile pic | Upload profilePicture only | Profile pic updated |

**Default behavior:** Adding photos keeps existing ones (no replaceAll needed).

**Face descriptors:** Automatically regenerated when face recognition photos change.
