# ONNX Models Directory

This directory should contain the face recognition ONNX model files.

## Required Model: MobileFaceNet.onnx

**File:** `MobileFaceNet.onnx`
**Size:** ~5-10 MB
**Input:** 112x112 RGB image
**Output:** 128-dimensional embedding

---

## Download Instructions

### Option 1: MobileFaceNet (Recommended)

MobileFaceNet is a lightweight model optimized for mobile devices.

**Download from:**
1. **Official ONNX Model Zoo:**
   ```bash
   wget https://github.com/onnx/models/raw/main/vision/body_analysis/arcface/model/mobilefacenet-res2-6.onnx -O MobileFaceNet.onnx
   ```

2. **Alternative sources:**
   - Search for "MobileFaceNet ONNX model" on GitHub
   - Download from Hugging Face model hub
   - Export from PyTorch/TensorFlow using official conversion tools

### Option 2: ArcFace ResNet100 (Higher Accuracy, Larger)

ArcFace provides higher accuracy but is larger and slower.

```bash
wget https://github.com/onnx/models/raw/main/vision/body_analysis/arcface/model/arcfaceresnet100-8.onnx -O ArcFace.onnx
```

**Note:** If using ArcFace, update `OnnxFaceService.ts` to load `ArcFace.onnx` and adjust input size to 112x112.

---

## Manual Download

If `wget` doesn't work:

1. Visit: https://github.com/onnx/models/tree/main/vision/body_analysis/arcface
2. Download the model file
3. Save it as `MobileFaceNet.onnx` in this directory

---

## Verify Download

After downloading, verify the model:

```bash
# Check file exists
ls -lh MobileFaceNet.onnx

# Should show ~5-10 MB file
```

---

## Testing the Model

Test the model loads correctly:

```bash
cd backend
npx ts-node -e "
const onnx = require('onnxruntime-node');
onnx.InferenceSession.create('src/models/MobileFaceNet.onnx')
  .then(() => console.log('✅ Model loaded successfully'))
  .catch(err => console.error('❌ Error:', err.message));
"
```

---

## Alternative: Use Pre-trained Models

If you can't find MobileFaceNet, you can use other face recognition models:

1. **FaceNet** (512-dim embeddings)
2. **VGGFace** (2622-dim embeddings)
3. **InsightFace** (512-dim embeddings)

**Note:** If using a different model, update:
- `OnnxFaceService.ts` - Change `INPUT_SIZE` and `EMBEDDING_SIZE`
- `StaffFaceEmbedding.ts` - Update embedding dimension validation

---

## Current Status

**Model Present:** ❌ Not yet downloaded

**Action Required:** Download MobileFaceNet.onnx using the instructions above.

---

## Need Help?

If you're having trouble downloading the model:

1. Check your internet connection
2. Try alternative download methods (browser, curl, etc.)
3. Ensure you have write permissions in this directory
4. Contact the team for a direct model file share

---

**Last Updated:** 2025-11-17
