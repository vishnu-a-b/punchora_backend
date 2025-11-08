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
                if (!business) {
                    return res.status(400).json({
                        success: false,
                        error: "Business ID is required",
                    });
                }
                const descriptors = yield this.service.getAllDescriptors(business, true);
                // Transform to API format
                const data = descriptors.map((d) => ({
                    id: d._id.toString(),
                    staffId: d.staffId.toString(),
                    staffName: d.staffName,
                    descriptor: d.descriptor,
                    photoUrl: d.photoUrl,
                    createdAt: d.createdAt.getTime(),
                    updatedAt: d.updatedAt.getTime(),
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
    }
}
exports.FaceDescriptorController = FaceDescriptorController;
exports.default = new FaceDescriptorController(FaceDescriptorService_1.default);
