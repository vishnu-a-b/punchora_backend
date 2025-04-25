import * as canvas from "canvas";
const tf = require("@tensorflow/tfjs-node");
const faceapi = require("@vladmandic/face-api");

import { User } from "../modules/user/models/User";
import path from "path";
import AttendanceError from "../errors/errorTypes/AttendanceError";
import { AverageFaceDescriptor } from "../modules/faceDescriptor/models/AverageFaceDescriptor";
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({
  Canvas,
  Image,
  ImageData,
} as any);

export class FaceRecognitionService {
  private faceMatchingThreshold = 0.45;

  constructor() {
    this.initializeFaceAPI();
  }

  private async initializeFaceAPI() {
    const MODEL_PATH = path.join(__dirname, "../../models");

    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
  }

  createDescriptor = async (user: string, images: string[]) => {
    try {
      const descriptors = [];
      for (const image of images) {
        const img = await canvas.loadImage(image);
        const detection = await faceapi
          .detectSingleFace(img as any)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          throw new Error("No face detected in the image");
        }
        descriptors.push(detection.descriptor);
      }
      const averageDescriptor = this.averageDescriptors(descriptors);

      await AverageFaceDescriptor.create({
        user,
        descriptor: averageDescriptor,
      });
    } catch (error) {
      console.log("Face registration failed:", error);
      return false;
    }
  };

  recognizeUser = async (image: string) => {
    try {
      const img = await canvas.loadImage(image);
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        console.log("No face detected in the image");
        throw new Error("No face detected in the image");
      }

      const records = await AverageFaceDescriptor.find();
      const values = records.map((record) => {
        return { user: record.user, descriptor: record.descriptor };
      });

      let bestMatch: { user: string | undefined; distance: number } = {
        user: "",
        distance: Infinity,
      };

      for (const { user, descriptor } of values) {
        const distance = faceapi.euclideanDistance(
          detection.descriptor,
          descriptor
        );
        if (distance < bestMatch.distance) {
          bestMatch = { user: user?.toString(), distance };
        }
      }
      console.log("bestMatch");
      console.log(bestMatch);
      console.log(bestMatch.distance);

      if (bestMatch.distance > this.faceMatchingThreshold) {
        console.log("No matching face found");
        throw new Error("No matching face found");
      }
      const user = await User.findById(bestMatch.user);

      return user;
    } catch (error) {
      console.error("Face recognition failed:", error);
      throw new AttendanceError({
        error:
          "Unable to detect face. Please position your face in front of the device",
      });
    }
  };

  averageDescriptors = (descriptors: Float32Array[]): Float32Array => {
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
}
