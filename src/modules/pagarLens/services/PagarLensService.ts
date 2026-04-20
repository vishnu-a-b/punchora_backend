import mongoose from "mongoose";
import StaffFaceEmbedding from "../../offlineFaceRecognition/models/StaffFaceEmbedding";
import { Attendance } from "../../attendance/models/Attendance";
import { Staff } from "../../staff/models/Staff";
import { AttendanceStatus } from "../../base/enums/attendanceStatus";

interface DescriptorItem {
  id: string;
  staffId: string;
  staffName: string;
  employeeId?: string;
  embedding: number[];
  updatedAt: string;
}

interface DescriptorPage {
  data: DescriptorItem[];
  pagination: { page: number; limit: number; total: number; hasMore: boolean };
}

interface AttendanceRecord {
  localId: string;
  staffId: string;
  timestamp: number;
  type: "IN" | "OUT";
  deviceId?: string;
}

interface RecordResult {
  localId: string;
  status: "success" | "error";
  serverId?: string;
  error?: string;
}

interface SyncAttendanceResult {
  results: RecordResult[];
  summary: { total: number; succeeded: number; failed: number };
}

export default class PagarLensService {
  /**
   * Fetch paginated face embeddings for a given business.
   * Uses an aggregation to join StaffFaceEmbedding → Staff and filter by business.
   */
  async getDescriptors(
    businessId: string,
    page: number,
    limit: number,
    lastSync?: string
  ): Promise<DescriptorPage> {
    const skip = (page - 1) * limit;
    const businessObjId = new mongoose.Types.ObjectId(businessId);

    const matchStage: Record<string, any> = { "staff.business": businessObjId };
    if (lastSync) {
      matchStage["updatedAt"] = { $gt: new Date(lastSync) };
    }

    const pipeline: any[] = [
      {
        $lookup: {
          from: "staffs",
          localField: "staffId",
          foreignField: "_id",
          as: "staff",
        },
      },
      { $unwind: "$staff" },
      { $match: matchStage },
      { $sort: { updatedAt: -1 } },
    ];

    // Count total for pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const [countResult] = await StaffFaceEmbedding.aggregate(countPipeline);
    const total = countResult?.total ?? 0;

    // Data pipeline with pagination
    const dataPipeline = [
      ...pipeline,
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          staffId: 1,
          staffName: "$staff.name",
          employeeId: "$staff.uid",
          embedding: 1,
          updatedAt: 1,
        },
      },
    ];

    const rows = await StaffFaceEmbedding.aggregate(dataPipeline);

    const data: DescriptorItem[] = rows.map((r: any) => ({
      id: r._id.toString(),
      staffId: r.staffId.toString(),
      staffName: r.staffName,
      employeeId: r.employeeId != null ? String(r.employeeId) : undefined,
      embedding: r.embedding,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : new Date(r.updatedAt).toISOString(),
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + data.length < total,
      },
    };
  }

  /**
   * Upsert attendance records from the kiosk device.
   * Uses idempotencyKey to prevent duplicates.
   */
  async syncAttendance(
    records: AttendanceRecord[],
    userId: string
  ): Promise<SyncAttendanceResult> {
    if (records.length > 100) {
      throw new Error("Batch size exceeds limit of 100 records");
    }

    const results: RecordResult[] = [];
    const now = Date.now();
    const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
    const MAX_FUTURE_MS = 5 * 60 * 1000; // 5 minutes

    for (const record of records) {
      try {
        // Validate staffId
        if (!mongoose.Types.ObjectId.isValid(record.staffId)) {
          results.push({ localId: record.localId, status: "error", error: "Invalid staffId" });
          continue;
        }

        // Validate timestamp
        const ts = record.timestamp;
        if (!ts || ts < now - MAX_AGE_MS || ts > now + MAX_FUTURE_MS) {
          results.push({ localId: record.localId, status: "error", error: "Timestamp out of valid range" });
          continue;
        }

        // Validate type
        if (record.type !== "IN" && record.type !== "OUT") {
          results.push({ localId: record.localId, status: "error", error: "Invalid type, must be IN or OUT" });
          continue;
        }

        // Confirm staff exists
        const staff = await Staff.findById(record.staffId).select("_id name business").lean();
        if (!staff) {
          results.push({ localId: record.localId, status: "error", error: "Staff not found" });
          continue;
        }

        const idempotencyKey = `${record.staffId}_${record.timestamp}_${record.type}`;
        const recordDate = new Date(record.timestamp);
        const dayStart = new Date(recordDate);
        dayStart.setHours(0, 0, 0, 0);

        let attendanceDoc: any;

        if (record.type === "IN") {
          attendanceDoc = await Attendance.findOneAndUpdate(
            { idempotencyKey },
            {
              $setOnInsert: {
                staff: new mongoose.Types.ObjectId(record.staffId),
                date: dayStart,
                checkInTime: recordDate,
                status: AttendanceStatus.checkedIn,
                idempotencyKey,
              },
            },
            { upsert: true, new: true }
          );
        } else {
          // OUT: update the most recent IN attendance for that day, or create standalone
          const existing = await Attendance.findOne({
            staff: new mongoose.Types.ObjectId(record.staffId),
            date: dayStart,
            checkInTime: { $exists: true },
            checkOutTime: { $exists: false },
          }).sort({ checkInTime: -1 });

          if (existing) {
            attendanceDoc = await Attendance.findOneAndUpdate(
              { idempotencyKey },
              {
                $setOnInsert: {
                  staff: new mongoose.Types.ObjectId(record.staffId),
                  date: dayStart,
                  checkOutTime: recordDate,
                  status: AttendanceStatus.present,
                  idempotencyKey,
                },
              },
              { upsert: true, new: true }
            );
            // Also update the matching check-in doc
            await Attendance.findByIdAndUpdate(existing._id, {
              checkOutTime: recordDate,
              status: AttendanceStatus.present,
            });
          } else {
            attendanceDoc = await Attendance.findOneAndUpdate(
              { idempotencyKey },
              {
                $setOnInsert: {
                  staff: new mongoose.Types.ObjectId(record.staffId),
                  date: dayStart,
                  checkOutTime: recordDate,
                  status: AttendanceStatus.present,
                  idempotencyKey,
                },
              },
              { upsert: true, new: true }
            );
          }
        }

        results.push({
          localId: record.localId,
          status: "success",
          serverId: attendanceDoc._id.toString(),
        });
      } catch (err: any) {
        // Duplicate key = already synced
        if (err.code === 11000) {
          const dup = await Attendance.findOne({
            idempotencyKey: `${record.staffId}_${record.timestamp}_${record.type}`,
          }).lean();
          results.push({
            localId: record.localId,
            status: "success",
            serverId: dup?._id?.toString(),
          });
        } else {
          results.push({
            localId: record.localId,
            status: "error",
            error: err.message ?? "Unknown error",
          });
        }
      }
    }

    const succeeded = results.filter((r) => r.status === "success").length;
    return {
      results,
      summary: { total: records.length, succeeded, failed: records.length - succeeded },
    };
  }
}
