import * as ort from "onnxruntime-node";
import sharp from "sharp";
import path from "path";
import fs from "fs";

/**
 * OnnxFaceService
 * Generates face embeddings using ONNX Runtime and MobileFaceNet model
 *
 * IMPORTANT: This is separate from the existing face-api.js system
 * This service uses ONNX models for compatibility with mobile offline recognition
 */

export class OnnxFaceService {
  private static instance: OnnxFaceService;
  private session: ort.InferenceSession | null = null;
  private modelPath: string;
  private readonly INPUT_SIZE = 112; // MobileFaceNet input size
  private readonly EMBEDDING_SIZE = 128;

  private constructor() {
    // Path to ONNX model file (you'll need to download MobileFaceNet.onnx)
    this.modelPath = path.join(
      __dirname,
      "../../../models/MobileFaceNet.onnx"
    );
  }

  public static getInstance(): OnnxFaceService {
    if (!OnnxFaceService.instance) {
      OnnxFaceService.instance = new OnnxFaceService();
    }
    return OnnxFaceService.instance;
  }

  /**
   * Initialize ONNX session (load model)
   */
  async initialize(): Promise<void> {
    try {
      if (!fs.existsSync(this.modelPath)) {
        console.warn(
          `⚠️ ONNX model not found at ${this.modelPath}. Download MobileFaceNet.onnx first.`
        );
        console.warn(
          "Download from: https://github.com/onnx/models/tree/main/vision/body_analysis/arcface"
        );
        return;
      }

      this.session = await ort.InferenceSession.create(this.modelPath);
      console.log("✅ ONNX MobileFaceNet model loaded successfully");
    } catch (error) {
      console.error("❌ Failed to load ONNX model:", error);
      throw error;
    }
  }

  /**
   * Preprocess image for MobileFaceNet
   * Input: 112x112 RGB image
   * Normalization: (pixel - 127.5) / 128.0
   */
  private async preprocessImage(imagePath: string): Promise<Float32Array> {
    try {
      // Resize and normalize image
      const imageBuffer = await sharp(imagePath)
        .resize(this.INPUT_SIZE, this.INPUT_SIZE, {
          fit: "cover",
          position: "center",
        })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = imageBuffer;
      const pixels = new Float32Array(
        3 * this.INPUT_SIZE * this.INPUT_SIZE
      );

      // Convert to CHW format and normalize
      // MobileFaceNet expects: (pixel - 127.5) / 128.0
      for (let i = 0; i < this.INPUT_SIZE * this.INPUT_SIZE; i++) {
        pixels[i] = (data[i * 3] - 127.5) / 128.0; // R
        pixels[this.INPUT_SIZE * this.INPUT_SIZE + i] =
          (data[i * 3 + 1] - 127.5) / 128.0; // G
        pixels[2 * this.INPUT_SIZE * this.INPUT_SIZE + i] =
          (data[i * 3 + 2] - 127.5) / 128.0; // B
      }

      return pixels;
    } catch (error) {
      console.error("Error preprocessing image:", error);
      throw new Error("Failed to preprocess image for face recognition");
    }
  }

  /**
   * Generate face embedding from image
   * Returns 128-dimensional embedding vector
   */
  async generateEmbedding(imagePath: string): Promise<number[]> {
    if (!this.session) {
      await this.initialize();
      if (!this.session) {
        throw new Error("ONNX model not initialized. Check model file.");
      }
    }

    try {
      // Preprocess image
      const inputData = await this.preprocessImage(imagePath);

      // Create tensor
      const inputTensor = new ort.Tensor("float32", inputData, [
        1,
        3,
        this.INPUT_SIZE,
        this.INPUT_SIZE,
      ]);

      // Run inference
      const feeds = { input: inputTensor }; // Adjust key based on model
      const results = await this.session.run(feeds);

      // Extract embedding (output name may vary, check your model)
      const outputTensor = results.output || results[Object.keys(results)[0]];
      const embedding = Array.from(outputTensor.data as Float32Array);

      // Normalize embedding (L2 normalization)
      const normalizedEmbedding = this.normalizeEmbedding(embedding);

      console.log(
        `✅ Generated ${normalizedEmbedding.length}D embedding for ${imagePath}`
      );
      return normalizedEmbedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate face embedding");
    }
  }

  /**
   * L2 normalize embedding vector
   */
  private normalizeEmbedding(embedding: number[]): number[] {
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    return embedding.map((val) => val / magnitude);
  }

  /**
   * Compare two embeddings using cosine similarity
   * Returns similarity score between -1 and 1 (higher is more similar)
   */
  static cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error("Embeddings must have same dimensions");
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return similarity;
  }

  /**
   * Check if two faces match based on threshold
   * Default threshold: 0.72 (adjust based on your needs)
   */
  static isSamePerson(
    embedding1: number[],
    embedding2: number[],
    threshold: number = 0.72
  ): boolean {
    const similarity = this.cosineSimilarity(embedding1, embedding2);
    return similarity >= threshold;
  }
}

export default OnnxFaceService.getInstance();
