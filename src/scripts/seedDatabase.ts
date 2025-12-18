/**
 * Database Seed Script
 * Creates a complete test environment with:
 * - 1 Business
 * - 2 Departments
 * - Users with all roles (super-admin, business-admin, hr-admin, department-head, control-room, staff)
 *
 * Usage: npm run seed
 */

import mongoose from 'mongoose';
import { User } from '../modules/user/models/User';
import { Business } from '../modules/business/models/Business';
import { Department } from '../modules/department/models/Department';
import { Staff } from '../modules/staff/models/Staff';
import Configs from '../configs/configs';
const bcrypt = require('bcryptjs');

// Configuration
const DB_URI = process.env.MONGODB_URI ||
  `mongodb+srv://${Configs.mongoUser}:${Configs.mongoPassword}@${Configs.mongoHost}/${Configs.mongoDatabase}` ||
  'mongodb://localhost:27017/punchora';
const SALT_ROUNDS = 10;

// Test data
const BUSINESS_NAME = 'Acme Corporation';
const DEPARTMENTS = ['Engineering', 'Marketing'];
const DEFAULT_PASSWORD = 'password123';

// User data
const USERS = {
  superAdmin: {
    name: 'Super Admin',
    mobileNo: '1000000001',
    email: 'superadmin@acme.com',
    role: 'super-admin',
    gender: 'Male'
  },
  businessAdmin: {
    name: 'Business Admin',
    mobileNo: '1000000002',
    email: 'bizadmin@acme.com',
    role: 'business-admin',
    gender: 'Female'
  },
  hrAdmin: {
    name: 'HR Admin',
    mobileNo: '1000000003',
    email: 'hradmin@acme.com',
    role: 'hr-admin',
    gender: 'Female'
  },
  controlRoom: {
    name: 'Control Room User',
    mobileNo: '1000000004',
    email: 'control@acme.com',
    role: 'control-room',
    gender: 'Male'
  },
  deptHead1: {
    name: 'Engineering Head',
    mobileNo: '1000000005',
    email: 'enghead@acme.com',
    role: 'department-head',
    gender: 'Male'
  },
  deptHead2: {
    name: 'Marketing Head',
    mobileNo: '1000000006',
    email: 'mkthead@acme.com',
    role: 'department-head',
    gender: 'Female'
  },
  staff1: {
    name: 'John Engineer',
    mobileNo: '1000000007',
    email: 'john@acme.com',
    role: 'staff',
    gender: 'Male'
  },
  staff2: {
    name: 'Jane Marketer',
    mobileNo: '1000000008',
    email: 'jane@acme.com',
    role: 'staff',
    gender: 'Female'
  },
  staff3: {
    name: 'Bob Developer',
    mobileNo: '1000000009',
    email: 'bob@acme.com',
    role: 'staff',
    gender: 'Male'
  },
  staff4: {
    name: 'Alice Designer',
    mobileNo: '1000000010',
    email: 'alice@acme.com',
    role: 'staff',
    gender: 'Female'
  }
};

async function connectDB() {
  try {
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function clearData() {
  console.log('\n🗑️  Clearing existing data...');

  try {
    await User.deleteMany({ mobileNo: { $regex: '^1000000' } });
    await Staff.deleteMany({});
    await Department.deleteMany({ name: { $in: DEPARTMENTS } });
    await Business.deleteMany({ name: BUSINESS_NAME });

    console.log('✅ Existing test data cleared');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

async function createBusiness() {
  console.log('\n🏢 Creating business...');

  try {
    const business = await Business.create({
      name: BUSINESS_NAME,
      managementType: 'Private',
      contactMobileNumbers: ['9876543210'],
      contactLandlines: ['080-12345678']
    });

    console.log(`✅ Created business: ${business.name} (ID: ${business._id})`);
    return business;
  } catch (error) {
    console.error('❌ Error creating business:', error);
    throw error;
  }
}

async function createDepartments(businessId: any) {
  console.log('\n🏛️  Creating departments...');

  try {
    const departments = await Department.insertMany([
      { name: DEPARTMENTS[0], business: businessId },
      { name: DEPARTMENTS[1], business: businessId }
    ]);

    departments.forEach(dept => {
      console.log(`✅ Created department: ${dept.name} (ID: ${dept._id})`);
    });

    return departments;
  } catch (error) {
    console.error('❌ Error creating departments:', error);
    throw error;
  }
}

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function createUsers(businessId: any, departments: any[]) {
  console.log('\n👥 Creating users...');

  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
  const createdUsers: any = {};

  try {
    // 1. Super Admin (no business/department)
    createdUsers.superAdmin = await User.create({
      ...USERS.superAdmin,
      password: hashedPassword,
      dateOfBirth: new Date('1980-01-01'),
      isSuperAdmin: true
    });
    console.log(`✅ Created: ${createdUsers.superAdmin.name} (${createdUsers.superAdmin.role})`);

    // 2. Business Admin (business only)
    createdUsers.businessAdmin = await User.create({
      ...USERS.businessAdmin,
      password: hashedPassword,
      business: businessId,
      dateOfBirth: new Date('1982-03-15')
    });
    console.log(`✅ Created: ${createdUsers.businessAdmin.name} (${createdUsers.businessAdmin.role})`);

    // 3. HR Admin (business only)
    createdUsers.hrAdmin = await User.create({
      ...USERS.hrAdmin,
      password: hashedPassword,
      business: businessId,
      dateOfBirth: new Date('1985-06-20')
    });
    console.log(`✅ Created: ${createdUsers.hrAdmin.name} (${createdUsers.hrAdmin.role})`);

    // 4. Control Room (no business/department)
    createdUsers.controlRoom = await User.create({
      ...USERS.controlRoom,
      password: hashedPassword,
      dateOfBirth: new Date('1988-09-10')
    });
    console.log(`✅ Created: ${createdUsers.controlRoom.name} (${createdUsers.controlRoom.role})`);

    // 5. Department Head 1 (business + department)
    createdUsers.deptHead1 = await User.create({
      ...USERS.deptHead1,
      password: hashedPassword,
      business: businessId,
      department: departments[0]._id,
      dateOfBirth: new Date('1983-11-05')
    });
    console.log(`✅ Created: ${createdUsers.deptHead1.name} (${createdUsers.deptHead1.role} - ${DEPARTMENTS[0]})`);

    // Update department head reference
    await Department.findByIdAndUpdate(departments[0]._id, {
      head: createdUsers.deptHead1._id
    });

    // 6. Department Head 2 (business + department)
    createdUsers.deptHead2 = await User.create({
      ...USERS.deptHead2,
      password: hashedPassword,
      business: businessId,
      department: departments[1]._id,
      dateOfBirth: new Date('1986-04-18')
    });
    console.log(`✅ Created: ${createdUsers.deptHead2.name} (${createdUsers.deptHead2.role} - ${DEPARTMENTS[1]})`);

    // Update department head reference
    await Department.findByIdAndUpdate(departments[1]._id, {
      head: createdUsers.deptHead2._id
    });

    // 7-8. Staff in Engineering department
    createdUsers.staff1 = await User.create({
      ...USERS.staff1,
      password: hashedPassword,
      business: businessId,
      department: departments[0]._id,
      dateOfBirth: new Date('1990-02-14')
    });
    console.log(`✅ Created: ${createdUsers.staff1.name} (${createdUsers.staff1.role} - ${DEPARTMENTS[0]})`);

    createdUsers.staff3 = await User.create({
      ...USERS.staff3,
      password: hashedPassword,
      business: businessId,
      department: departments[0]._id,
      dateOfBirth: new Date('1992-07-22')
    });
    console.log(`✅ Created: ${createdUsers.staff3.name} (${createdUsers.staff3.role} - ${DEPARTMENTS[0]})`);

    // 9-10. Staff in Marketing department
    createdUsers.staff2 = await User.create({
      ...USERS.staff2,
      password: hashedPassword,
      business: businessId,
      department: departments[1]._id,
      dateOfBirth: new Date('1991-05-30')
    });
    console.log(`✅ Created: ${createdUsers.staff2.name} (${createdUsers.staff2.role} - ${DEPARTMENTS[1]})`);

    createdUsers.staff4 = await User.create({
      ...USERS.staff4,
      password: hashedPassword,
      business: businessId,
      department: departments[1]._id,
      dateOfBirth: new Date('1993-12-08')
    });
    console.log(`✅ Created: ${createdUsers.staff4.name} (${createdUsers.staff4.role} - ${DEPARTMENTS[1]})`);

    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  }
}

async function createStaffRecords(users: any, businessId: any, departments: any[]) {
  console.log('\n📋 Creating staff records...');

  try {
    // Staff 1 - Engineering
    const staff1 = await Staff.create({
      user: users.staff1._id,
      name: users.staff1.name,
      department: departments[0]._id,
      business: businessId,
      designation: 'Senior Software Engineer',
      joinDate: new Date('2020-01-15'),
      role: 'regular-staff',
      type: 'inside-staff',
      salary: 75000
    });
    console.log(`✅ Created staff record: ${staff1.name} (UID: ${staff1.uid})`);

    // Staff 3 - Engineering
    const staff3 = await Staff.create({
      user: users.staff3._id,
      name: users.staff3.name,
      department: departments[0]._id,
      business: businessId,
      designation: 'Junior Developer',
      joinDate: new Date('2021-06-01'),
      role: 'regular-staff',
      type: 'inside-staff',
      salary: 50000
    });
    console.log(`✅ Created staff record: ${staff3.name} (UID: ${staff3.uid})`);

    // Staff 2 - Marketing
    const staff2 = await Staff.create({
      user: users.staff2._id,
      name: users.staff2.name,
      department: departments[1]._id,
      business: businessId,
      designation: 'Marketing Manager',
      joinDate: new Date('2019-09-10'),
      role: 'regular-staff',
      type: 'inside-staff',
      salary: 70000
    });
    console.log(`✅ Created staff record: ${staff2.name} (UID: ${staff2.uid})`);

    // Staff 4 - Marketing
    const staff4 = await Staff.create({
      user: users.staff4._id,
      name: users.staff4.name,
      department: departments[1]._id,
      business: businessId,
      designation: 'Graphic Designer',
      joinDate: new Date('2021-03-20'),
      role: 'regular-staff',
      type: 'inside-staff',
      salary: 55000
    });
    console.log(`✅ Created staff record: ${staff4.name} (UID: ${staff4.uid})`);

    return [staff1, staff2, staff3, staff4];
  } catch (error) {
    console.error('❌ Error creating staff records:', error);
    throw error;
  }
}

function printSummary(business: any, departments: any[], users: any) {
  console.log('\n' + '='.repeat(70));
  console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
  console.log('='.repeat(70));

  console.log('\n📊 SUMMARY:');
  console.log(`   Business: ${business.name}`);
  console.log(`   Departments: ${departments.length}`);
  console.log(`   Users: ${Object.keys(users).length}`);

  console.log('\n🔑 LOGIN CREDENTIALS:');
  console.log('   Default Password: ' + DEFAULT_PASSWORD);
  console.log('   ' + '-'.repeat(66));

  const credentials = [
    {
      role: 'Super Admin',
      mobile: USERS.superAdmin.mobileNo,
      email: USERS.superAdmin.email,
      access: 'All businesses, all permissions'
    },
    {
      role: 'Business Admin',
      mobile: USERS.businessAdmin.mobileNo,
      email: USERS.businessAdmin.email,
      access: `${BUSINESS_NAME} - Full control`
    },
    {
      role: 'HR Admin',
      mobile: USERS.hrAdmin.mobileNo,
      email: USERS.hrAdmin.email,
      access: `${BUSINESS_NAME} - Level 2 approver, view-only`
    },
    {
      role: 'Dept Head (Eng)',
      mobile: USERS.deptHead1.mobileNo,
      email: USERS.deptHead1.email,
      access: `${DEPARTMENTS[0]} - Level 1 approver`
    },
    {
      role: 'Dept Head (Mkt)',
      mobile: USERS.deptHead2.mobileNo,
      email: USERS.deptHead2.email,
      access: `${DEPARTMENTS[1]} - Level 1 approver`
    },
    {
      role: 'Control Room',
      mobile: USERS.controlRoom.mobileNo,
      email: USERS.controlRoom.email,
      access: 'All businesses - View geo & attendance'
    },
    {
      role: 'Staff (Eng)',
      mobile: USERS.staff1.mobileNo,
      email: USERS.staff1.email,
      access: `${DEPARTMENTS[0]} - Apply leave, own data`
    },
    {
      role: 'Staff (Eng)',
      mobile: USERS.staff3.mobileNo,
      email: USERS.staff3.email,
      access: `${DEPARTMENTS[0]} - Apply leave, own data`
    },
    {
      role: 'Staff (Mkt)',
      mobile: USERS.staff2.mobileNo,
      email: USERS.staff2.email,
      access: `${DEPARTMENTS[1]} - Apply leave, own data`
    },
    {
      role: 'Staff (Mkt)',
      mobile: USERS.staff4.mobileNo,
      email: USERS.staff4.email,
      access: `${DEPARTMENTS[1]} - Apply leave, own data`
    }
  ];

  credentials.forEach((cred, index) => {
    console.log(`\n   ${index + 1}. ${cred.role}`);
    console.log(`      Mobile: ${cred.mobile}`);
    console.log(`      Email: ${cred.email}`);
    console.log(`      Access: ${cred.access}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('\n📝 NEXT STEPS:');
  console.log('   1. Start backend: cd backend && npm start');
  console.log('   2. Start frontend: cd admin_dashboard && npm run dev');
  console.log('   3. Login with any mobile number above and password: ' + DEFAULT_PASSWORD);
  console.log('   4. Test the two-level leave approval workflow');
  console.log('\n' + '='.repeat(70) + '\n');
}

async function main() {
  try {
    console.log('\n🌱 Starting database seed...\n');

    await connectDB();
    await clearData();

    const business = await createBusiness();
    const departments = await createDepartments(business._id);
    const users = await createUsers(business._id, departments);
    await createStaffRecords(users, business._id, departments);

    printSummary(business, departments, users);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default main;
