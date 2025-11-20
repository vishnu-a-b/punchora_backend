"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnnxFaceService = void 0;
const ort = __importStar(require("onnxruntime-node"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * OnnxFaceService
 * Generates face embeddings using ONNX Runtime and MobileFaceNet model
 *
 * IMPORTANT: This is separate from the existing face-api.js system
 * This service uses ONNX models for compatibility with mobile offline recognition
 */
class OnnxFaceService {
    constructor() {
        this.session = null;
        this.INPUT_SIZE = 112; // MobileFaceNet/ArcFace input size
        this.EMBEDDING_SIZE = 512; // ArcFace: 512, MobileFaceNet: 128
        // Path to ONNX model file (you'll need to download MobileFaceNet.onnx)
        this.modelPath = path_1.default.join(__dirname, "../../../models/MobileFaceNet.onnx");
    }
    static getInstance() {
        if (!OnnxFaceService.instance) {
            OnnxFaceService.instance = new OnnxFaceService();
        }
        return OnnxFaceService.instance;
    }
    /**
     * Initialize ONNX session (load model)
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!fs_1.default.existsSync(this.modelPath)) {
                    console.warn(`⚠️ ONNX model not found at ${this.modelPath}. Download MobileFaceNet.onnx first.`);
                    console.warn("Download from: https://github.com/onnx/models/tree/main/vision/body_analysis/arcface");
                    return;
                }
                this.session = yield ort.InferenceSession.create(this.modelPath);
                console.log("✅ ONNX MobileFaceNet model loaded successfully");
            }
            catch (error) {
                console.error("❌ Failed to load ONNX model:", error);
                throw error;
            }
        });
    }
    /**
     * Preprocess image for MobileFaceNet
     * Input: 112x112 RGB image
     * Normalization: (pixel - 127.5) / 128.0
     */
    preprocessImage(imagePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Resize and normalize image
                const imageBuffer = yield (0, sharp_1.default)(imagePath)
                    .resize(this.INPUT_SIZE, this.INPUT_SIZE, {
                    fit: "cover",
                    position: "center",
                })
                    .raw()
                    .toBuffer({ resolveWithObject: true });
                const { data, info } = imageBuffer;
                const pixels = new Float32Array(3 * this.INPUT_SIZE * this.INPUT_SIZE);
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
            }
            catch (error) {
                console.error("Error preprocessing image:", error);
                throw new Error("Failed to preprocess image for face recognition");
            }
        });
    }
    /**
     * Generate face embedding from image
     * Returns 128-dimensional embedding vector
     */
    generateEmbedding(imagePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.session) {
                yield this.initialize();
                if (!this.session) {
                    throw new Error("ONNX model not initialized. Check model file.");
                }
            }
            try {
                // Preprocess image
                const inputData = yield this.preprocessImage(imagePath);
                // Create tensor
                const inputTensor = new ort.Tensor("float32", inputData, [
                    1,
                    3,
                    this.INPUT_SIZE,
                    this.INPUT_SIZE,
                ]);
                // Run inference
                // Try common input names: 'input', 'data', 'images'
                let feeds = null;
                let results = null;
                const inputNames = ['input', 'data', 'images', 'input.1'];
                for (const inputName of inputNames) {
                    try {
                        feeds = { [inputName]: inputTensor };
                        results = yield this.session.run(feeds);
                        break; // Success, exit loop
                    }
                    catch (error) {
                        if (error.message.includes('missing in')) {
                            continue; // Try next input name
                        }
                        throw error; // Different error, throw it
                    }
                }
                if (!results) {
                    throw new Error('Could not find correct input name for ONNX model');
                }
                // Extract embedding (output name may vary, check your model)
                const outputTensor = results.output || results[Object.keys(results)[0]];
                const embedding = Array.from(outputTensor.data);
                // Normalize embedding (L2 normalization)
                const normalizedEmbedding = this.normalizeEmbedding(embedding);
                console.log(`✅ Generated ${normalizedEmbedding.length}D embedding for ${imagePath}`);
                return normalizedEmbedding;
            }
            catch (error) {
                console.error("Error generating embedding:", error);
                throw new Error("Failed to generate face embedding");
            }
        });
    }
    /**
     * L2 normalize embedding vector
     */
    normalizeEmbedding(embedding) {
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map((val) => val / magnitude);
    }
    /**
     * Compare two embeddings using cosine similarity
     * Returns similarity score between -1 and 1 (higher is more similar)
     */
    static cosineSimilarity(embedding1, embedding2) {
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
    static isSamePerson(embedding1, embedding2, threshold = 0.72) {
        const similarity = this.cosineSimilarity(embedding1, embedding2);
        return similarity >= threshold;
    }
}
exports.OnnxFaceService = OnnxFaceService;
exports.default = OnnxFaceService.getInstance();
