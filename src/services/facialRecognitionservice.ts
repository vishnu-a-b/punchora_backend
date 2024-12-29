import * as canvas from "canvas";
const tf = require("@tensorflow/tfjs-node");
const faceapi = require("@vladmandic/face-api");

import { FaceDescriptor } from "../modules/faceDescriptor/models/FaceDescriptor";
import { User } from "../modules/user/models/User";
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({
  Canvas,
  Image,
  ImageData,
} as any);

export class FaceRecognitionService {
  private faceMatchingThreshold = 0.7;

  constructor() {
    this.initializeFaceAPI();
  }

  private async initializeFaceAPI() {
    await faceapi.nets.faceRecognitionNet.loadFromDisk("models");
    await faceapi.nets.faceLandmark68Net.loadFromDisk("models");
    await faceapi.nets.ssdMobilenetv1.loadFromDisk("models");
  }

  createDescriptor = async (user: string, image: string) => {
    try {
      const img = await canvas.loadImage(image);
      const detection = await faceapi
        .detectSingleFace(img as any)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error("No face detected in the image");
      }
      await FaceDescriptor.create({
        user,
        descriptor: Array.from(detection.descriptor),
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
        throw new Error("No face detected in the image");
      }

      const records = await FaceDescriptor.find();
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

      if (bestMatch.distance > this.faceMatchingThreshold) {
        throw new Error("No matching face found");
      }
      const user = await User.findById(bestMatch.user);
      if (!user) {
        throw new Error();
      }

      return user;
    } catch (error) {
      console.error("Face recognition failed:", error);
      throw new Error("unable to detect face");
    }
  };
}
