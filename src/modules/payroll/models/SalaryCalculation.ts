import mongoose from "mongoose";

const customColumnSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    formula: { type: String, default: "" },
    type: {
      type: String,
      enum: ["addition", "deduction", "neutral"],
      default: "neutral",
    },
  },
  { _id: false }
);

const computedFieldsSchema = new mongoose.Schema(
  {
    baseSalary:       { type: Number, default: null },
    oneDaySalary:     { type: Number, default: null },
    oneHourSalary:    { type: Number, default: null },
    workedDays:       { type: Number, default: 0 },
    totalOff:         { type: Number, default: 0 },
    offTaken:         { type: Number, default: 0 },
    payableDays:      { type: Number, default: 0 },
    punchoutMissing:  { type: Number, default: 0 },
    punchoutFine:     { type: Number, default: 0 },
    otHours:          { type: Number, default: 0 },
    otAmount:         { type: Number, default: 0 },
    finedHours:       { type: Number, default: 0 },
    lateFine:         { type: Number, default: 0 },
    incentive:        { type: Number, default: 0 },
    tdsPercentage:    { type: Number, default: 0 },
    esiPercentage:    { type: Number, default: 0 },
    pfPercentage:     { type: Number, default: 0 },
    tds:              { type: Number, default: 0 },
    esi:              { type: Number, default: 0 },
    pf:               { type: Number, default: 0 },
    addition:         { type: Number, default: 0 },
    deduction:        { type: Number, default: 0 },
    netSalary:        { type: Number, default: null },
  },
  { _id: false }
);

const staffPayrollRowSchema = new mongoose.Schema(
  {
    staff:       { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    name:        { type: String, default: "" },
    designation: { type: String, default: "" },
    department:  { type: String, default: "" },
    weeklyOff:   { type: String, default: "weekly-off" },
    computed:    { type: computedFieldsSchema, default: () => ({}) },
    overrides:   { type: Map, of: Number, default: () => new Map() },
    formulaDescriptions: { type: Map, of: String, default: () => new Map() },
    customValues: { type: Map, of: Number, default: () => new Map() },
    notes:        { type: Map, of: String, default: () => new Map() },
  },
  { _id: false }
);

const salaryCalculationSchema = new mongoose.Schema(
  {
    business:   { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd:   { type: Date, required: true },
    label:       { type: String, default: "" },
    status:      { type: String, enum: ["draft", "finalized"], default: "draft" },
    coolOffMinutes: { type: Number, default: 5 },
    holidays:    { type: [Date], default: [] },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    customColumns: { type: [customColumnSchema], default: [] },
    rows:        { type: [staffPayrollRowSchema], default: [] },
  },
  { timestamps: true }
);

salaryCalculationSchema.index({ business: 1, periodStart: -1 });
salaryCalculationSchema.index({ business: 1, periodStart: 1, periodEnd: 1 });

export const SalaryCalculation = mongoose.model("SalaryCalculation", salaryCalculationSchema);
