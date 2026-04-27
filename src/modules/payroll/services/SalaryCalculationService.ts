import { Staff } from "../../staff/models/Staff";
import { Attendance } from "../../attendance/models/Attendance";

// ─────────────────────────────────────────────
// Pure calculation helpers (ported from PayRollHome.tsx)
// ─────────────────────────────────────────────

function calculateTimeDiff(checkInTime: Date, checkOutTime: Date): number {
  return checkOutTime.getTime() - checkInTime.getTime(); // ms
}

export function calculateLateFine(
  staff: any,
  records: any[],
  totalHoursWorked: number, // ms
  hasMissingCheckout: boolean,
  coolOffMinutes: number
): number {
  if (!records || records.length === 0 || !records[0].checkInTime) return 0;
  if (hasMissingCheckout) return 0;
  if (staff.shiftType === "no timing") return 0;

  const checkInDate = new Date(records[0].checkInTime);
  const oneDaySalary = staff.salary ? staff.salary / 30 : 0;
  let actualMinutesWorked = totalHoursWorked / (1000 * 60);
  let lateFine = 0;

  switch (staff.shiftType) {
    case "hour base": {
      const requiredMinutes = staff.hoursWorked || 0;
      if (actualMinutesWorked < requiredMinutes - coolOffMinutes) {
        const shortfallMinutes = requiredMinutes - actualMinutesWorked;
        const hourlyRate = oneDaySalary / (requiredMinutes / 60);
        const hoursShort = Math.ceil(shortfallMinutes / 60);
        lateFine = hourlyRate * hoursShort;
      }
      break;
    }
    case "single shift":
    case "multi shift": {
      if (staff.shifts && staff.shifts.length > 0) {
        let minLateFine = Infinity;
        staff.shifts.forEach((shift: any) => {
          const shiftStartTime = new Date(shift.startTime);
          const requiredMinutes = shift.minutesWorked;
          const todayShiftStart = new Date(checkInDate);
          todayShiftStart.setHours(shiftStartTime.getHours());
          todayShiftStart.setMinutes(shiftStartTime.getMinutes() + coolOffMinutes);
          todayShiftStart.setSeconds(0);
          todayShiftStart.setMilliseconds(0);

          let shiftTimingFine = 0;
          let shiftHourFine = 0;
          let adjustedMinutes = actualMinutesWorked;

          if (checkInDate > todayShiftStart) {
            const diffMs = checkInDate.getTime() - todayShiftStart.getTime();
            const diffMinutes = Math.ceil(diffMs / (1000 * 60));
            const hourlyRate = oneDaySalary / (requiredMinutes / 60);
            const hoursLate = Math.ceil(diffMinutes / 60);
            shiftTimingFine = hourlyRate * hoursLate;
            adjustedMinutes = adjustedMinutes + diffMinutes;
          }

          if (!hasMissingCheckout && adjustedMinutes < requiredMinutes - coolOffMinutes) {
            const shortfallMinutes = requiredMinutes - adjustedMinutes;
            const hourlyRate = oneDaySalary / (requiredMinutes / 60);
            const hoursShort = Math.ceil(shortfallMinutes / 60);
            shiftHourFine = hourlyRate * hoursShort;
          }

          const shiftLateFine = Math.max(shiftTimingFine, shiftHourFine);
          if (shiftLateFine < minLateFine) minLateFine = shiftLateFine;
        });
        lateFine = minLateFine === Infinity ? 0 : minLateFine;
      }
      break;
    }
    default:
      break;
  }

  return Math.round(lateFine * 100) / 100;
}

// Returns the number of hours that caused a fine (mirrors calculateLateFine logic)
function calculateDailyFineHours(
  staff: any,
  records: any[],
  totalHoursWorked: number,
  hasMissingCheckout: boolean,
  coolOffMinutes: number
): number {
  if (!records || records.length === 0 || !records[0].checkInTime) return 0;
  if (hasMissingCheckout) return 0;
  if (staff.shiftType === "no timing") return 0;

  const checkInDate = new Date(records[0].checkInTime);
  let actualMinutesWorked = totalHoursWorked / (1000 * 60);
  let fineHours = 0;

  switch (staff.shiftType) {
    case "hour base": {
      const requiredMinutes = staff.hoursWorked || 0;
      if (actualMinutesWorked < requiredMinutes - coolOffMinutes) {
        fineHours = Math.ceil((requiredMinutes - actualMinutesWorked) / 60);
      }
      break;
    }
    case "single shift":
    case "multi shift": {
      if (staff.shifts && staff.shifts.length > 0) {
        let minFineHours = Infinity;
        staff.shifts.forEach((shift: any) => {
          const shiftStartTime = new Date(shift.startTime);
          const requiredMinutes = shift.minutesWorked;
          const todayShiftStart = new Date(checkInDate);
          todayShiftStart.setHours(shiftStartTime.getHours());
          todayShiftStart.setMinutes(shiftStartTime.getMinutes() + coolOffMinutes);
          todayShiftStart.setSeconds(0);
          todayShiftStart.setMilliseconds(0);

          let timingHours = 0;
          let shortfallHours = 0;
          let adjustedMinutes = actualMinutesWorked;

          if (checkInDate > todayShiftStart) {
            const diffMs = checkInDate.getTime() - todayShiftStart.getTime();
            const diffMinutes = Math.ceil(diffMs / (1000 * 60));
            timingHours = Math.ceil(diffMinutes / 60);
            adjustedMinutes = adjustedMinutes + diffMinutes;
          }

          if (!hasMissingCheckout && adjustedMinutes < requiredMinutes - coolOffMinutes) {
            shortfallHours = Math.ceil((requiredMinutes - adjustedMinutes) / 60);
          }

          const shiftFineHours = Math.max(timingHours, shortfallHours);
          if (shiftFineHours < minFineHours) minFineHours = shiftFineHours;
        });
        fineHours = minFineHours === Infinity ? 0 : minFineHours;
      }
      break;
    }
    default:
      break;
  }

  return fineHours;
}

export function calculateDailyOTPay(
  staff: any,
  records: any[],
  totalHoursWorked: number,
  hasMissingCheckout: boolean,
  coolOffMinutes: number
): number {
  if (!staff.otEnabled || hasMissingCheckout) return 0;
  if (!records || records.length === 0) return 0;
  if (staff.shiftType === "no timing") return 0;

  const oneDaySalary = staff.salary ? staff.salary / 30 : 0;
  if (!oneDaySalary) return 0;

  const { otMinutes, requiredMinutesForRate } = getOTMinutes(staff, totalHoursWorked, coolOffMinutes);
  const otHours = Math.floor(otMinutes / 60);
  if (otHours <= 0) return 0;
  const hourlyRate = oneDaySalary / (requiredMinutesForRate / 60);
  return Math.round(hourlyRate * (staff.otMultiplier || 1.5) * otHours * 100) / 100;
}

// Returns OT hours (integer) for a single day
function calculateDailyOTHours(
  staff: any,
  records: any[],
  totalHoursWorked: number,
  hasMissingCheckout: boolean,
  coolOffMinutes: number
): number {
  if (!staff.otEnabled || hasMissingCheckout) return 0;
  if (!records || records.length === 0) return 0;
  if (staff.shiftType === "no timing") return 0;
  const { otMinutes } = getOTMinutes(staff, totalHoursWorked, coolOffMinutes);
  return Math.floor(otMinutes / 60);
}

function getOTMinutes(
  staff: any,
  totalHoursWorked: number,
  coolOffMinutes: number
): { otMinutes: number; requiredMinutesForRate: number } {
  const actualMinutesWorked = totalHoursWorked / (1000 * 60);
  let otMinutes = 0;
  let requiredMinutesForRate = 480;

  switch (staff.shiftType) {
    case "hour base": {
      const reqMin = staff.hoursWorked || 0;
      if (reqMin > 0 && actualMinutesWorked > reqMin + coolOffMinutes) {
        otMinutes = (actualMinutesWorked - reqMin) + coolOffMinutes;
        requiredMinutesForRate = reqMin;
      }
      break;
    }
    case "single shift":
    case "multi shift": {
      if (staff.shifts && staff.shifts.length > 0) {
        let maxOT = 0;
        staff.shifts.forEach((shift: any) => {
          const reqMin = shift.minutesWorked || 0;
          if (reqMin > 0 && actualMinutesWorked > reqMin + coolOffMinutes) {
            const extra = (actualMinutesWorked - reqMin) + coolOffMinutes;
            if (extra > maxOT) {
              maxOT = extra;
              requiredMinutesForRate = reqMin;
            }
          }
        });
        otMinutes = maxOT;
      }
      break;
    }
    default:
      break;
  }

  return { otMinutes, requiredMinutesForRate };
}

function getOneHourSalary(staff: any, oneDaySalary: number | null): number | null {
  if (!oneDaySalary) return null;
  switch (staff.shiftType) {
    case "hour base": {
      const reqMin = staff.hoursWorked || 0;
      if (!reqMin) return null;
      return Math.round((oneDaySalary / (reqMin / 60)) * 100) / 100;
    }
    case "single shift":
    case "multi shift": {
      if (staff.shifts && staff.shifts.length > 0) {
        const reqMin = staff.shifts[0].minutesWorked || 0;
        if (!reqMin) return null;
        return Math.round((oneDaySalary / (reqMin / 60)) * 100) / 100;
      }
      return null;
    }
    default:
      return null;
  }
}

// ─────────────────────────────────────────────
// Core initialization logic
// ─────────────────────────────────────────────

export interface InitParams {
  businessId: string;
  periodStart: Date;
  periodEnd: Date;
  coolOffMinutes: number;
  holidays: Date[];
}

export async function initializeCalculation(params: InitParams) {
  const { businessId, periodStart, periodEnd, coolOffMinutes, holidays } = params;

  const staffList = await Staff.find({ business: businessId, isActive: true })
    .populate("department", "name")
    .lean();

  const staffIds = staffList.map((s: any) => s._id);

  const attendanceRecords = await Attendance.find({
    staff: { $in: staffIds },
    checkInTime: { $gte: periodStart, $lte: periodEnd },
    status: { $in: ["present", "checkedIn"] },
  }).lean();

  // Generate all dates in the period
  const allDates: Date[] = [];
  const cur = new Date(periodStart);
  while (cur <= periodEnd) {
    allDates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  const holidaySet = new Set(holidays.map((d) => new Date(d).toDateString()));
  const sundayCount = allDates.filter((d) => d.getDay() === 0).length;
  const holidayCount = allDates.filter(
    (d) => d.getDay() !== 0 && holidaySet.has(d.toDateString())
  ).length;
  const sundayAndHolidayCount = sundayCount + holidayCount;

  // Group attendance by staffId → dateKey → records[]
  const staffAttendanceMap = new Map<string, Map<string, any[]>>();
  for (const rec of attendanceRecords) {
    const sid = rec.staff?.toString();
    if (!sid) continue;
    const dateKey = new Date(rec.checkInTime || rec.date).toDateString();
    if (!staffAttendanceMap.has(sid)) staffAttendanceMap.set(sid, new Map());
    const dateMap = staffAttendanceMap.get(sid)!;
    if (!dateMap.has(dateKey)) dateMap.set(dateKey, []);
    dateMap.get(dateKey)!.push(rec);
  }

  const rows = staffList.flatMap((staff: any) => {
    const dateMap = staffAttendanceMap.get(staff._id.toString()) || new Map<string, any[]>();

    // Skip staff with no punching in this period
    if (dateMap.size === 0) return [];

    let totalDays = 0;
    let totalHours = 0; // ms
    let punchoutMissing = 0;
    let totalDailyFines = 0;
    let totalDailyOTPay = 0;
    let totalOTHours = 0;
    let totalFinedHours = 0;

    allDates.forEach((calDate) => {
      const dateKey = calDate.toDateString();
      if (!dateMap.has(dateKey)) return;
      const recs = dateMap.get(dateKey)!;
      totalDays++;

      const dayHours = recs.reduce((acc: number, item: any) => {
        if (item.checkInTime && item.checkOutTime) {
          return acc + calculateTimeDiff(new Date(item.checkInTime), new Date(item.checkOutTime));
        }
        return acc;
      }, 0);
      totalHours += dayHours;

      const hasMissing = recs.some((r: any) => !r.checkOutTime);
      if (hasMissing) punchoutMissing++;

      totalDailyFines += calculateLateFine(staff, recs, dayHours, hasMissing, coolOffMinutes);
      totalDailyOTPay += calculateDailyOTPay(staff, recs, dayHours, hasMissing, coolOffMinutes);
      totalOTHours   += calculateDailyOTHours(staff, recs, dayHours, hasMissing, coolOffMinutes);
      totalFinedHours += calculateDailyFineHours(staff, recs, dayHours, hasMissing, coolOffMinutes);
    });

    const staffWeeklyOff = staff.weeklyOff || "weekly-off";
    const staffExtraOff = staff.extraOff || 0;
    const extraOffInPeriod = Math.round((staffExtraOff / 30) * allDates.length);

    // Night-off: 1 comp-off per consecutive run of night shifts
    // e.g. Mon+Tue+Wed nights in a row → 1 off; then Fri night → 1 off = 2 total
    let nightShiftCount = 0;
    if (staffWeeklyOff === "night-off") {
      const nightDays: number[] = []; // checkin date as ms timestamp (midnight)
      dateMap.forEach((recs) => {
        recs.forEach((rec: any) => {
          if (!rec.checkInTime || !rec.checkOutTime) return;
          const ci = new Date(rec.checkInTime);
          const co = new Date(rec.checkOutTime);
          if (co.toDateString() !== ci.toDateString()) {
            const day = new Date(ci.getFullYear(), ci.getMonth(), ci.getDate()).getTime();
            nightDays.push(day);
          }
        });
      });

      nightDays.sort((a, b) => a - b);
      const ONE_DAY = 86400000;
      for (let i = 0; i < nightDays.length; i++) {
        nightShiftCount++; // new run starts
        // skip all consecutive next days (same run)
        while (i + 1 < nightDays.length && nightDays[i + 1] - nightDays[i] === ONE_DAY) {
          i++;
        }
      }
    }

    // Entitled paid off days per staff type
    const effectiveSundayCount =
      staffWeeklyOff === "no-off" ? 0
      : staffWeeklyOff === "night-off" ? nightShiftCount
      : sundayCount;

    // totalOff = sundays (or comp-offs) + extra offs + holidays
    const totalOff = effectiveSundayCount + extraOffInPeriod + holidayCount;

    // AB = all days in period with no punch (includes Sundays/off days not punched)
    const AB = allDates.length - totalDays;

    // Sandwich leave: a Sunday or holiday surrounded by absent working days
    // counts as a leave, not a paid off day
    const sundayIsOff = staffWeeklyOff !== "no-off" && staffWeeklyOff !== "night-off";
    const sandwichDates = new Set<string>();
    allDates.forEach((date) => {
      const dateKey = date.toDateString();
      const isSunday = date.getDay() === 0;
      const isHoliday = holidaySet.has(dateKey);
      if (!(isSunday && sundayIsOff) && !isHoliday) return;
      if (dateMap.has(dateKey)) return; // worked that day → not sandwich

      let beforeCount = 0;
      const bDate = new Date(date);
      bDate.setDate(bDate.getDate() - 1);
      while (bDate >= periodStart) {
        const k = bDate.toDateString();
        // For night-off/no-off staff, Sunday is a regular working day — check dateMap
        if ((sundayIsOff && bDate.getDay() === 0) || holidaySet.has(k)) { beforeCount++; }
        else if (!dateMap.has(k)) { beforeCount++; }
        else break;
        bDate.setDate(bDate.getDate() - 1);
      }

      let afterCount = 0;
      const aDate = new Date(date);
      aDate.setDate(aDate.getDate() + 1);
      while (aDate <= periodEnd) {
        const k = aDate.toDateString();
        // For night-off/no-off staff, Sunday is a regular working day — check dateMap
        if ((sundayIsOff && aDate.getDay() === 0) || holidaySet.has(k)) { afterCount++; }
        else if (!dateMap.has(k)) { afterCount++; }
        else break;
        aDate.setDate(aDate.getDate() + 1);
      }

      if (beforeCount + 1 + afterCount >= 5) sandwichDates.add(dateKey);
    });
    const sandwichCount = sandwichDates.size;

    // Absent working days = days with no punch minus entitled off days, plus sandwich
    const leavesTaken = Math.max(0, AB - totalOff) + sandwichCount;

    // payableDays = (30 - AB) + sundays + extraOff + holidays - sandwich
    // sandwich Sundays/holidays become leaves, not paid off days
    const payableDays = (30 - AB) + totalOff - sandwichCount;

    const baseSalary = staff.salary ?? null;
    const oneDaySalary = baseSalary ? Math.round((baseSalary / 30) * 100) / 100 : null;
    const oneHourSalary = getOneHourSalary(staff, oneDaySalary);

    let totalSalaryAmount: number | null = null;
    let lateFine: number;

    if (staff.shiftType === "no timing") {
      totalSalaryAmount = baseSalary;
      lateFine = punchoutMissing * 100;
    } else {
      totalSalaryAmount = oneDaySalary ? oneDaySalary * payableDays : null;
      lateFine = totalDailyFines + punchoutMissing * 100;
    }

    // Store percentages so frontend can recompute from the Salary column
    const tdsPercentage = staff.tdsPercentage || 0;
    const esiPercentage = staff.esiPercentage || 0;
    const pfPercentage  = staff.pfPercentage  || 0;

    // Default TDS/ESI/PF amounts (frontend will recompute from intermediate Salary)
    const tds = baseSalary ? Math.round(baseSalary * (tdsPercentage / 100) * 100) / 100 : 0;
    const esi = baseSalary ? Math.round(baseSalary * (esiPercentage / 100) * 100) / 100 : 0;
    const pf  = baseSalary ? Math.round(baseSalary * (pfPercentage  / 100) * 100) / 100 : 0;

    const netSalary =
      totalSalaryAmount !== null
        ? Math.round((totalSalaryAmount - lateFine - tds - esi - pf + totalDailyOTPay) * 100) / 100
        : null;

    const formulaDescriptions: Record<string, string> = {
      baseSalary:    `Staff monthly salary: ₹${baseSalary ?? "N/A"}`,
      oneDaySalary:  `Base salary ₹${baseSalary ?? 0} ÷ 30 = ₹${oneDaySalary ?? "N/A"}`,
      oneHourSalary: `One day salary ÷ shift hours = ₹${oneHourSalary ?? "N/A"}`,
      workedDays:    `Days with attendance records in period`,
      abDays:        `Not present: ${allDates.length} period days − ${totalDays} punched = ${AB}`,
      totalOff:      `Entitled off days: ${effectiveSundayCount} (Sun/Comp) + ${extraOffInPeriod} extra + ${holidayCount} holidays = ${totalOff}`,
      offTaken:      `Absent: ${AB} no-punch − ${totalOff} off + ${sandwichCount} sandwich = ${leavesTaken}`,
      payableDays:   `(30 − ${AB}) + ${effectiveSundayCount} sun + ${extraOffInPeriod} extra + ${holidayCount} holidays − ${sandwichCount} sandwich = ${payableDays}`,
      punchoutMissing: `${punchoutMissing} days with missing checkout`,
      punchoutFine: `${punchoutMissing} × ₹100 = ₹${punchoutMissing * 100}`,
      otHours:       `Total overtime hours across all worked days`,
      otAmount:      `OT pay across all worked days: ₹${totalDailyOTPay.toFixed(2)}`,
      finedHours:    `Total hours penalised for late/shortfall across all days`,
      lateFine:      staff.shiftType === "no timing"
        ? `No timing staff: ₹100 × ${punchoutMissing} missing checkouts = ₹${lateFine}`
        : `Late/shortfall fines ₹${totalDailyFines.toFixed(2)} + ₹100×${punchoutMissing} punchout = ₹${lateFine.toFixed(2)}`,
      tds: `${tdsPercentage}% of Salary column = ₹${tds} (default from base; recalculated in sheet)`,
      esi: `${esiPercentage}% of Salary column = ₹${esi} (default from base; recalculated in sheet)`,
      pf:  `${pfPercentage}%  of Salary column = ₹${pf} (default from base; recalculated in sheet)`,
      netSalary: totalSalaryAmount !== null
        ? `₹${totalSalaryAmount.toFixed(2)} - ₹${lateFine.toFixed(2)} fine - ₹${tds} TDS - ₹${esi} ESI - ₹${pf} PF + ₹${totalDailyOTPay.toFixed(2)} OT = ₹${netSalary}`
        : "Salary not set",
    };

    return {
      staff: staff._id,
      name: staff.name || "",
      designation: staff.designation || "",
      department: (staff.department as any)?.name || "",
      computed: {
        baseSalary,
        oneDaySalary,
        oneHourSalary,
        workedDays: totalDays,
        abDays: AB,
        totalOff,
        offTaken: leavesTaken,
        payableDays,
        punchoutMissing,
        punchoutFine: punchoutMissing * 100,
        otHours: totalOTHours,
        otAmount: totalDailyOTPay,
        finedHours: totalFinedHours,
        lateFine,
        incentive: 0,
        tdsPercentage,
        esiPercentage,
        pfPercentage,
        tds,
        esi,
        pf,
        addition: 0,
        deduction: 0,
        netSalary,
      },
      overrides: {},
      formulaDescriptions,
      customValues: {},
    };
  });

  // Sort by department then name
  rows.sort((a, b) => {
    const deptCmp = a.department.localeCompare(b.department);
    if (deptCmp !== 0) return deptCmp;
    return a.name.localeCompare(b.name);
  });

  return rows;
}
