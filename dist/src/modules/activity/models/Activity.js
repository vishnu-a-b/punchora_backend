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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Activity = exports.ActivityStatus = exports.ActivityType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var ActivityType;
(function (ActivityType) {
    ActivityType["TEA_BREAK"] = "tea-break";
    ActivityType["LUNCH_BREAK"] = "lunch-break";
    ActivityType["WASHROOM"] = "washroom";
    ActivityType["CARE_OR_ONSITE"] = "care-or-onsite";
    ActivityType["TRIP"] = "trip";
    ActivityType["OTHER"] = "other";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
var ActivityStatus;
(function (ActivityStatus) {
    ActivityStatus["STARTED"] = "started";
    ActivityStatus["ENDED"] = "ended";
})(ActivityStatus || (exports.ActivityStatus = ActivityStatus = {}));
const ActivitySchema = new mongoose_1.Schema({
    staff: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Staff",
        required: true,
        index: true
    },
    business: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Business",
        required: true,
        index: true
    },
    department: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Department"
    },
    type: {
        type: String,
        enum: Object.values(ActivityType),
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: Object.values(ActivityStatus),
        required: true,
        default: ActivityStatus.STARTED
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number // in minutes
    },
    location: {
        type: String
    },
    reason: {
        type: String
    },
    photo: {
        type: String
    },
    meterReadingStart: {
        type: Number
    },
    meterReadingEnd: {
        type: Number
    },
    vehiclePhoto: {
        type: String
    },
    gpsLocation: {
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        },
        accuracy: {
            type: Number
        }
    }
}, {
    timestamps: true
});
// PHASE 5: Optimized indexes based on actual query patterns
// Staff activity queries with status filtering and time sorting
ActivitySchema.index({ staff: 1, status: 1, startTime: -1 }); // getOngoingActivities
ActivitySchema.index({ staff: 1, startTime: -1 }); // getStaffActivities sorted by time
// Business activity queries with time sorting
ActivitySchema.index({ business: 1, startTime: -1 }); // getBusinessActivities sorted by time
ActivitySchema.index({ business: 1, department: 1 }); // Department filtering
// Type and status filtering
ActivitySchema.index({ type: 1, status: 1 });
// Calculate duration before saving
ActivitySchema.pre("save", function (next) {
    if (this.endTime && this.startTime) {
        const endTime = this.endTime;
        const startTime = this.startTime;
        const durationMs = endTime.getTime() - startTime.getTime();
        this.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
    }
    next();
});
exports.Activity = mongoose_1.default.model("Activity", ActivitySchema);
