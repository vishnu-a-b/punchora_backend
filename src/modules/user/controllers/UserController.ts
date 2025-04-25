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
            photoUrls.push(Configs.domain + file.filename);
          });
          req.body.photos = photoUrls;
        }
        if (files.profilePicture?.[0]) {
          req.body.profilePicture =
            Configs.domain + files.profilePicture?.[0].filename;
        }
      }

      const user = await this.service.create(req.body);
      if (req.files) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        if (files.photos) {
          files.photos.forEach((file) => {
            this.facialRecognitionService.createDescriptor(user.id, file.path);
          });
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
      if (req.files) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        if (files.photos) {
          files.photos.forEach((file) => {
            photoUrls.push(Configs.domain + file.filename);
          });
          req.body.photos = photoUrls;
        }
        if (files.profilePicture?.[0]) {
          req.body.profilePicture =
            Configs.domain + files.profilePicture?.[0].filename;
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
      if (req.body.photo) {
        body.photo = req.body.photo;
      }
      const user = await this.service.update(req.params.id, body);
      if (!user) {
        throw new NotFoundError({ error: "user not found" });
      }
      this.sendSuccessResponse(res, 200, { data: { _id: user!._id } });
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

  createAverageFaceDescriptors = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const users = await User.find().limit(300);
      let completedUsers = 0;
      for (const user of users) {
        console.log("user", user.name);
        const descriptors = await FaceDescriptor.find({ user: user.id });
        console.log("got descriptors", descriptors.length);
        if(descriptors.length>0)console.log(descriptors[0].descriptor)
        const averageDescriptor = this.averageDescriptors(
          descriptors.map((des) => new Float32Array(des.descriptor))
        );
        console.log("average descriptor")
        console.log(averageDescriptor)
        await AverageFaceDescriptor.create({
          user: user.id,
          descriptor: averageDescriptor,
        });
        console.log("average descriptor created");
        completedUsers = completedUsers + 1;
      }
      this.sendSuccessResponse(res, 204, { data: { total: completedUsers } });
    } catch (e: any) {
      next(e);
    }
  };

  averageDescriptors = (descriptors: Float32Array[]): number[] => {
    const avg: Array<number> = [];
    descriptors.forEach((desc) => {
      if (desc.length === 128) {
        desc.forEach((val, i) => {
          avg[i] += val;
        });
      }
    });
    console.log("average inside", avg)
    if (avg.length === 128) {
      for (let i = 0; i < 128; i++) {
        avg[i] /= descriptors.length;
      }
    }

    return avg;
  };
}
