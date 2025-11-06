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
exports.FaceRecognitionService = void 0;
const canvas = __importStar(require("canvas"));
const tf = require("@tensorflow/tfjs-node");
const faceapi = require("@vladmandic/face-api");
const User_1 = require("../modules/user/models/User");
const path_1 = __importDefault(require("path"));
const AttendanceError_1 = __importDefault(require("../errors/errorTypes/AttendanceError"));
const AverageFaceDescriptor_1 = require("../modules/faceDescriptor/models/AverageFaceDescriptor");
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({
    Canvas,
    Image,
    ImageData,
});
class FaceRecognitionService {
    constructor() {
        this.faceMatchingThreshold = 0.45;
        this.createDescriptor = (user, images) => __awaiter(this, void 0, void 0, function* () {
            try {
                const descriptors = [];
                for (const image of images) {
                    const img = yield canvas.loadImage(image);
                    const detection = yield faceapi
                        .detectSingleFace(img)
                        .withFaceLandmarks()
                        .withFaceDescriptor();
                    if (!detection) {
                        throw new Error("No face detected in the image");
                    }
                    descriptors.push(detection.descriptor);
                }
                const averageDescriptor = this.averageDescriptors(descriptors);
                yield AverageFaceDescriptor_1.AverageFaceDescriptor.create({
                    user,
                    descriptor: averageDescriptor,
                });
            }
            catch (error) {
                console.log("Face registration failed:", error);
                return false;
            }
        });
        this.recognizeUser = (image) => __awaiter(this, void 0, void 0, function* () {
            try {
                const img = yield canvas.loadImage(image);
                const detection = yield faceapi
                    .detectSingleFace(img)
                    .withFaceLandmarks()
                    .withFaceDescriptor();
                if (!detection) {
                    console.log("No face detected in the image");
                    throw new Error("No face detected in the image");
                }
                const records = yield AverageFaceDescriptor_1.AverageFaceDescriptor.find();
                const values = records.map((record) => {
                    return { user: record.user, descriptor: record.descriptor };
                });
                let bestMatch = {
                    user: "",
                    distance: Infinity,
                };
                for (const { user, descriptor } of values) {
                    const distance = faceapi.euclideanDistance(detection.descriptor, descriptor);
                    if (distance < bestMatch.distance) {
                        bestMatch = { user: user === null || user === void 0 ? void 0 : user.toString(), distance };
                    }
                }
                console.log("bestMatch");
                console.log(bestMatch);
                console.log(bestMatch.distance);
                if (bestMatch.distance > this.faceMatchingThreshold) {
                    console.log("No matching face found");
                    throw new Error("No matching face found");
                }
                const user = yield User_1.User.findById(bestMatch.user);
                return user;
            }
            catch (error) {
                console.error("Face recognition failed:", error);
                throw new AttendanceError_1.default({
                    error: "Unable to detect face. Please position your face in front of the device",
                });
            }
        });
        this.averageDescriptors = (descriptors) => {
            const avg = new Float32Array(128);
            descriptors.forEach((desc) => {
                if (desc.length === 128) {
                    desc.forEach((val, i) => {
                        avg[i] += val;
                    });
                }
            });
            if (avg.length === 128) {
                for (let i = 0; i < 128; i++) {
                    avg[i] /= descriptors.length;
                }
            }
            return avg;
        };
        this.initializeFaceAPI();
    }
    initializeFaceAPI() {
        return __awaiter(this, void 0, void 0, function* () {
            const MODEL_PATH = path_1.default.join(__dirname, "../../models");
            yield faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
            yield faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
            yield faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
        });
    }
}
exports.FaceRecognitionService = FaceRecognitionService;
