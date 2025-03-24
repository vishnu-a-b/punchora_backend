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
        console.log("files===");
        console.log(req.files);
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        if (files.photos) {
          console.log("photos exist");
          console.log(files.photos);
          files.photos.forEach((file) => {
            photoUrls.push(Configs.domain + file.filename);
          });
          req.body.photos = photoUrls;
        }
        if (files.profilePicture?.[0]) {
          console.log("profilePicture exist");
          console.log(files.profilePicture);
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
}
