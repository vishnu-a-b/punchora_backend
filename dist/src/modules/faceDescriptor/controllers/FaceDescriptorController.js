"use strict";
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
exports.FaceDescriptorController = void 0;
const BaseController_1 = __importDefault(require("../../base/controllers.ts/BaseController"));
const FaceDescriptorService_1 = __importDefault(require("../services/FaceDescriptorService"));
const AverageFaceDescriptor_1 = require("../models/AverageFaceDescriptor");
const FaceDescriptor_1 = require("../models/FaceDescriptor");
const Staff_1 = require("../../staff/models/Staff");
class FaceDescriptorController extends BaseController_1.default {
    constructor(service) {
        super();
        this.service = service;
        /**
         * Get all face descriptors for a business
         */
        this.getAllDescriptors = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { business } = req.query;
                // if (!business) {
                //   return res.status(400).json({
                //     success: false,
                //     error: "Business ID is required",
                //   });
                // }
                const descriptors = yield this.service.getAllDescriptors(
                // business as string,
                false // Return all descriptors, not just active ones
                );
                // Transform to API format
                const data = descriptors.map((d) => ({
                    id: d._id ? d._id.toString() : '',
                    staffId: d.staffId ? d.staffId.toString() : '',
                    staffName: d.staffName || '',
                    descriptor: d.descriptor || [],
                    photoUrl: d.photoUrl || '',
                    createdAt: d.createdAt ? new Date(d.createdAt).getTime() : Date.now(),
                    updatedAt: d.updatedAt ? new Date(d.updatedAt).getTime() : Date.now(),
                }));
                this.sendSuccessResponse(res, 200, { data });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Create or update face descriptor
         */
        this.upsertDescriptor = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, staffId, staffName, descriptor, photoUrl } = req.body;
                const business = req.query.business || req.body.business;
                // Validate required fields
                if (!staffId || !staffName || !descriptor || !business) {
                    return res.status(400).json({
                        success: false,
                        error: "Missing required fields: staffId, staffName, descriptor, business",
                    });
                }
                // Validate descriptor length
                if (!Array.isArray(descriptor) || descriptor.length !== 128) {
                    return res.status(400).json({
                        success: false,
                        error: "Descriptor must be a 128-dimensional array",
                    });
                }
                const result = yield this.service.upsertDescriptor({
                    id,
                    staffId,
                    staffName,
                    descriptor,
                    photoUrl,
                    business: business,
                });
                this.sendSuccessResponse(res, id ? 200 : 201, {
                    data: {
                        id: result._id.toString(),
                        staffId: result.staffId.toString(),
                        staffName: result.staffName,
                        photoUrl: result.photoUrl,
                        createdAt: result.createdAt.getTime(),
                        updatedAt: result.updatedAt.getTime(),
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Delete face descriptor
         */
        this.deleteDescriptor = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (!id) {
                    return res.status(400).json({
                        success: false,
                        error: "Descriptor ID is required",
                    });
                }
                yield this.service.deleteDescriptor(id);
                this.sendSuccessResponse(res, 200, {
                    data: { message: "Face descriptor deleted successfully" },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Recognize a face from an uploaded photo
         */
        this.recognize = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!req.file) {
                    return res.status(400).json({ success: false, error: "No photo provided" });
                }
                const businessId = req.query.business;
                const result = yield this.service.recognizeFromPhoto(req.file.path, businessId);
                if (!result) {
                    return res.status(200).json({ success: true, data: { recognized: false } });
                }
                this.sendSuccessResponse(res, 200, {
                    data: {
                        recognized: true,
                        staffId: result.staffId,
                        staffName: result.staffName,
                        confidence: result.confidence,
                        photoUrl: result.photoUrl,
                    },
                });
            }
            catch (error) {
                // If face not detected, return as unrecognized (not an error)
                if ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes("No face detected")) {
                    return res.status(200).json({ success: true, data: { recognized: false, reason: "no_face" } });
                }
                next(error);
            }
        });
        /**
         * Get descriptor count
         */
        this.getDescriptorCount = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { business } = req.query;
                if (!business) {
                    return res.status(400).json({
                        success: false,
                        error: "Business ID is required",
                    });
                }
                const count = yield this.service.getDescriptorCount(business, true);
                this.sendSuccessResponse(res, 200, { data: { count } });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get face descriptor status for a specific user
         * Returns whether the user has an average descriptor and how many individual descriptors exist
         */
        this.getUserDescriptorStatus = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const [avg, staff] = yield Promise.all([
                    AverageFaceDescriptor_1.AverageFaceDescriptor.findOne({ user: userId }),
                    Staff_1.Staff.findOne({ user: userId }),
                ]);
                const descriptorCount = staff
                    ? yield FaceDescriptor_1.FaceDescriptor.countDocuments({ staffId: staff._id, isActive: true })
                    : 0;
                this.sendSuccessResponse(res, 200, {
                    data: {
                        hasAverage: !!avg,
                        descriptorCount,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.FaceDescriptorController = FaceDescriptorController;
exports.default = new FaceDescriptorController(FaceDescriptorService_1.default);
