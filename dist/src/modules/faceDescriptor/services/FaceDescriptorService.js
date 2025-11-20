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
exports.FaceDescriptorService = void 0;
const FaceDescriptor_1 = __importDefault(require("../models/FaceDescriptor"));
const mongoose_1 = __importDefault(require("mongoose"));
class FaceDescriptorService {
    constructor() {
        /**
         * Get all face descriptors for a business
         */
        this.getAllDescriptors = (...args_1) => __awaiter(this, [...args_1], void 0, function* (
        // businessId: string,
        activeOnly = true) {
            const query = {};
            if (activeOnly) {
                query.isActive = true;
            }
            return yield FaceDescriptor_1.default.find(query)
                .sort({ updatedAt: -1 })
                .lean();
        });
        /**
         * Get face descriptors by staff ID
         */
        this.getDescriptorsByStaffId = (staffId_1, ...args_1) => __awaiter(this, [staffId_1, ...args_1], void 0, function* (staffId, activeOnly = true) {
            const query = { staffId };
            if (activeOnly) {
                query.isActive = true;
            }
            return yield FaceDescriptor_1.default.find(query)
                .sort({ createdAt: -1 })
                .lean();
        });
        /**
         * Create or update face descriptor
         */
        this.upsertDescriptor = (data) => __awaiter(this, void 0, void 0, function* () {
            // If ID provided, update existing
            if (data.id) {
                const existing = yield FaceDescriptor_1.default.findById(data.id);
                if (existing) {
                    existing.descriptor = data.descriptor;
                    existing.staffName = data.staffName;
                    if (data.photoUrl) {
                        existing.photoUrl = data.photoUrl;
                    }
                    yield existing.save();
                    return existing;
                }
            }
            // Create new descriptor
            const descriptor = new FaceDescriptor_1.default({
                _id: data.id || new mongoose_1.default.Types.ObjectId(),
                staffId: data.staffId,
                staffName: data.staffName,
                descriptor: data.descriptor,
                photoUrl: data.photoUrl,
                business: data.business,
                isActive: true,
            });
            yield descriptor.save();
            return descriptor;
        });
        /**
         * Deactivate face descriptor
         */
        this.deactivateDescriptor = (descriptorId) => __awaiter(this, void 0, void 0, function* () {
            yield FaceDescriptor_1.default.findByIdAndUpdate(descriptorId, {
                isActive: false,
            });
        });
        /**
         * Delete face descriptor
         */
        this.deleteDescriptor = (descriptorId) => __awaiter(this, void 0, void 0, function* () {
            yield FaceDescriptor_1.default.findByIdAndDelete(descriptorId);
        });
        /**
         * Get descriptors updated after a certain time
         */
        this.getDescriptorsUpdatedAfter = (businessId, afterTimestamp) => __awaiter(this, void 0, void 0, function* () {
            return yield FaceDescriptor_1.default.find({
                business: businessId,
                updatedAt: { $gte: afterTimestamp },
            })
                .sort({ updatedAt: -1 })
                .lean();
        });
        /**
         * Get descriptor count for a business
         */
        this.getDescriptorCount = (businessId_1, ...args_1) => __awaiter(this, [businessId_1, ...args_1], void 0, function* (businessId, activeOnly = true) {
            const query = { business: businessId };
            if (activeOnly) {
                query.isActive = true;
            }
            return yield FaceDescriptor_1.default.countDocuments(query);
        });
    }
}
exports.FaceDescriptorService = FaceDescriptorService;
exports.default = new FaceDescriptorService();
