import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

// CSV seed data (fallback if xlsx not found)
const csvData = [
  { id: 1001, date: '2026-01-08', department: 'IT', category: 'Cloud Infrastructure', vendor: 'Microsoft Azure', location: 'Bengaluru', businessUnit: 'Technology', budget: 185000, actualSpend: 162400, status: 'Approved', priority: 'High', paymentMethod: 'Monthly' },
  { id: 1002, date: '2026-01-07', department: 'Procurement', category: 'Office Supplies', vendor: 'Staples', location: 'Mumbai', businessUnit: 'Corporate', budget: 42000, actualSpend: 36750, status: 'Approved', priority: 'Medium', paymentMethod: 'Purchase Order' },
  { id: 1003, date: '2026-01-11', department: 'Marketing', category: 'Digital Advertising', vendor: 'Google Ads', location: 'Delhi NCR', businessUnit: 'Marketing', budget: 125000, actualSpend: 113800, status: 'Approved', priority: 'High', paymentMethod: 'Monthly' },
  { id: 1004, date: '2026-01-16', department: 'Finance', category: 'Consulting', vendor: 'Deloitte', location: 'Mumbai', businessUnit: 'Finance', budget: 210000, actualSpend: 198500, status: 'Approved', priority: 'High', paymentMethod: 'Project' },
  { id: 1005, date: '2026-01-22', department: 'HR', category: 'Recruitment', vendor: 'LinkedIn', location: 'Bengaluru', businessUnit: 'People', budget: 68000, actualSpend: 54200, status: 'Approved', priority: 'Medium', paymentMethod: 'Annual Contract' },
  { id: 1006, date: '2026-01-28', department: 'Operations', category: 'Travel', vendor: 'Corporate Travel Co.', location: 'Hyderabad', businessUnit: 'Operations', budget: 95000, actualSpend: 102300, status: 'Over Budget', priority: 'Medium', paymentMethod: 'Corporate Card' },
  { id: 1007, date: '2026-02-03', department: 'IT', category: 'Software Licenses', vendor: 'Adobe', location: 'Chennai', businessUnit: 'Technology', budget: 78000, actualSpend: 69400, status: 'Approved', priority: 'Medium', paymentMethod: 'Annual Contract' },
  { id: 1008, date: '2026-02-09', department: 'Facilities', category: 'Maintenance', vendor: 'CBRE', location: 'Pune', businessUnit: 'Corporate', budget: 145000, actualSpend: 121600, status: 'Approved', priority: 'High', paymentMethod: 'Purchase Order' },
  { id: 1009, date: '2026-02-14', department: 'Sales', category: 'Events', vendor: 'EventWorks', location: 'Mumbai', businessUnit: 'Sales', budget: 160000, actualSpend: 139500, status: 'Approved', priority: 'High', paymentMethod: 'Project' },
  { id: 1010, date: '2026-02-21', department: 'Procurement', category: 'Hardware', vendor: 'Dell Technologies', location: 'Chennai', businessUnit: 'Technology', budget: 320000, actualSpend: 287800, status: 'Approved', priority: 'High', paymentMethod: 'Purchase Order' },
  { id: 1011, date: '2026-03-02', department: 'Marketing', category: 'Content Services', vendor: 'ContentHub', location: 'Hyderabad', businessUnit: 'Marketing', budget: 85000, actualSpend: 91800, status: 'Over Budget', priority: 'Medium', paymentMethod: 'Project' },
  { id: 1012, date: '2026-03-08', department: 'IT', category: 'Cloud Infrastructure', vendor: 'Amazon Web Services', location: 'Pune', businessUnit: 'Technology', budget: 240000, actualSpend: 211700, status: 'Approved', priority: 'High', paymentMethod: 'Monthly' },
  { id: 1013, date: '2026-03-15', department: 'Finance', category: 'Software', vendor: 'Oracle', location: 'Delhi NCR', businessUnit: 'Finance', budget: 175000, actualSpend: 151200, status: 'Approved', priority: 'High', paymentMethod: 'Annual Contract' },
  { id: 1014, date: '2026-03-19', department: 'HR', category: 'Employee Training', vendor: 'SkillPro', location: 'Chennai', businessUnit: 'People', budget: 72000, actualSpend: 58300, status: 'Approved', priority: 'Low', paymentMethod: 'Project' },
  { id: 1015, date: '2026-03-26', department: 'Operations', category: 'Logistics', vendor: 'BlueDart', location: 'Mumbai', businessUnit: 'Operations', budget: 135000, actualSpend: 126400, status: 'Approved', priority: 'Medium', paymentMethod: 'Purchase Order' },
  { id: 1016, date: '2026-04-03', department: 'IT', category: 'Cybersecurity', vendor: 'CrowdStrike', location: 'Bengaluru', businessUnit: 'Technology', budget: 195000, actualSpend: 171900, status: 'Approved', priority: 'High', paymentMethod: 'Annual Contract' },
  { id: 1017, date: '2026-04-10', department: 'Sales', category: 'Travel', vendor: 'Corporate Travel Co.', location: 'Pune', businessUnit: 'Sales', budget: 110000, actualSpend: 97400, status: 'Approved', priority: 'Medium', paymentMethod: 'Corporate Card' },
  { id: 1018, date: '2026-04-17', department: 'Marketing', category: 'Digital Advertising', vendor: 'Meta Ads', location: 'Hyderabad', businessUnit: 'Marketing', budget: 140000, actualSpend: 128600, status: 'Approved', priority: 'High', paymentMethod: 'Monthly' },
  { id: 1019, date: '2026-04-23', department: 'Facilities', category: 'Utilities', vendor: 'Tata Power', location: 'Delhi NCR', businessUnit: 'Corporate', budget: 88000, actualSpend: 93400, status: 'Over Budget', priority: 'Medium', paymentMethod: 'Monthly' },
  { id: 1020, date: '2026-04-29', department: 'Procurement', category: 'Hardware', vendor: 'HP Enterprise', location: 'Bengaluru', businessUnit: 'Technology', budget: 275000, actualSpend: 231500, status: 'Approved', priority: 'High', paymentMethod: 'Purchase Order' },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.spendRecord.deleteMany();
  await prisma.user.deleteMany();

  // Create test user
  const password = 'Test@1234';
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: 'Intern User',
      email: 'intern@spendtracker.com',
      password: hashedPassword,
    },
  });

  console.log('✅ Test user created');
  console.log('📧 Email:    intern@spendtracker.com');
  console.log('🔑 Password: Test@1234');

  // Try to parse xlsx file
  let records = csvData;
  const xlsxPaths = [
    path.join(__dirname, '..', '..', 'Assignment_Data...Spend&Saving.xlsx'),
    path.join(__dirname, '..', 'Assignment_Data...Spend&Saving.xlsx'),
    path.join(process.cwd(), 'Assignment_Data...Spend&Saving.xlsx'),
  ];

  let xlsxFound = false;
  for (const xlsxPath of xlsxPaths) {
    if (fs.existsSync(xlsxPath)) {
      try {
        const XLSX = await import('xlsx');
        const workbook = XLSX.readFile(xlsxPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        if (data.length > 0) {
          records = (data as any[]).map((row: any) => ({
            id: Number(row.id || row.ID),
            date: row.date || row.Date,
            department: row.department || row.Department,
            category: row.category || row.Category,
            vendor: row.vendor || row.Vendor,
            location: row.location || row.Location,
            businessUnit: row.businessUnit || row.BusinessUnit || row['Business Unit'],
            budget: Number(row.budget || row.Budget),
            actualSpend: Number(row.actualSpend || row.ActualSpend || row['Actual Spend']),
            status: row.status || row.Status,
            priority: row.priority || row.Priority,
            paymentMethod: row.paymentMethod || row.PaymentMethod || row['Payment Method'],
          }));
          xlsxFound = true;
          console.log(`📊 Loaded ${records.length} records from Excel file`);
          break;
        }
      } catch (err) {
        console.log('⚠️  Excel parse error, falling back to CSV data');
      }
    }
  }

  if (!xlsxFound) {
    console.log('📋 Using built-in CSV seed data (20 records)');
  }

  // Insert spend records
  for (const row of records) {
    await prisma.spendRecord.create({
      data: {
        id: row.id,
        date: new Date(row.date),
        department: String(row.department),
        category: String(row.category),
        vendor: String(row.vendor),
        location: String(row.location),
        businessUnit: String(row.businessUnit),
        budget: row.budget,
        actualSpend: row.actualSpend,
        status: String(row.status),
        priority: String(row.priority),
        paymentMethod: String(row.paymentMethod),
      },
    });
  }

  console.log(`✅ Seeded ${records.length} spend records`);
  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST CREDENTIALS:');
  console.log('  Email:    intern@spendtracker.com');
  console.log('  Password: Test@1234');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
