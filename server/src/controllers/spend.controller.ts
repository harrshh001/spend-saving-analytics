import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { buildWhereClause, FilterParams } from '../utils/buildFilters';
import { enrichRecord, computeSummary } from '../utils/calculations';

const prisma = new PrismaClient();

const spendRecordSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  department: z.string().min(1, 'Department is required'),
  category: z.string().min(1, 'Category is required'),
  vendor: z.string().min(1, 'Vendor is required'),
  location: z.string().min(1, 'Location is required'),
  businessUnit: z.string().min(1, 'Business Unit is required'),
  budget: z.coerce.number().min(0, 'Budget must be >= 0'),
  actualSpend: z.coerce.number().min(0, 'Actual Spend must be >= 0'),
  status: z.string().min(1, 'Status is required'),
  priority: z.string().min(1, 'Priority is required'),
  paymentMethod: z.string().min(1, 'Payment Method is required'),
});

const patchSchema = spendRecordSchema.partial();

function extractFilters(query: any): FilterParams {
  return {
    dateFrom: query.dateFrom as string,
    dateTo: query.dateTo as string,
    businessUnit: query.businessUnit,
    category: query.category,
    vendor: query.vendor,
    location: query.location,
    status: query.status,
    search: query.search as string,
  };
}

// GET /api/spend
export const getSpendRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = extractFilters(req.query);
    const where = buildWhereClause(filters);

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const sortBy = (req.query.sortBy as string) || 'date';
    const sortDir = (req.query.sortDir as string) === 'asc' ? 'asc' : 'desc';

    const validSortFields = ['date', 'department', 'category', 'vendor', 'location', 'businessUnit', 'budget', 'actualSpend', 'status', 'priority', 'id'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'date';

    const [total, records] = await Promise.all([
      prisma.spendRecord.count({ where }),
      prisma.spendRecord.findMany({
        where,
        orderBy: { [orderByField]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      data: records.map(enrichRecord),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
};

// GET /api/spend/summary
export const getSpendSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = extractFilters(req.query);
    const where = buildWhereClause(filters);
    const records = await prisma.spendRecord.findMany({ where });
    const summary = computeSummary(records);
    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to compute summary' });
  }
};

// GET /api/spend/filter-options
export const getFilterOptions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [businessUnits, categories, vendors, locations, statuses, departments, priorities, paymentMethods] = await Promise.all([
      prisma.spendRecord.findMany({ select: { businessUnit: true }, distinct: ['businessUnit'] }),
      prisma.spendRecord.findMany({ select: { category: true }, distinct: ['category'] }),
      prisma.spendRecord.findMany({ select: { vendor: true }, distinct: ['vendor'] }),
      prisma.spendRecord.findMany({ select: { location: true }, distinct: ['location'] }),
      prisma.spendRecord.findMany({ select: { status: true }, distinct: ['status'] }),
      prisma.spendRecord.findMany({ select: { department: true }, distinct: ['department'] }),
      prisma.spendRecord.findMany({ select: { priority: true }, distinct: ['priority'] }),
      prisma.spendRecord.findMany({ select: { paymentMethod: true }, distinct: ['paymentMethod'] }),
    ]);

    res.json({
      businessUnit: businessUnits.map((r) => r.businessUnit).sort(),
      category: categories.map((r) => r.category).sort(),
      vendor: vendors.map((r) => r.vendor).sort(),
      location: locations.map((r) => r.location).sort(),
      status: statuses.map((r) => r.status).sort(),
      department: departments.map((r) => r.department).sort(),
      priority: priorities.map((r) => r.priority).sort(),
      paymentMethod: paymentMethods.map((r) => r.paymentMethod).sort(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
};

// GET /api/spend/:id
export const getSpendRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }
    const record = await prisma.spendRecord.findUnique({ where: { id } });
    if (!record) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    res.json(enrichRecord(record));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch record' });
  }
};

// POST /api/spend
export const createSpendRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = spendRecordSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const data = result.data;
    const record = await prisma.spendRecord.create({
      data: {
        date: new Date(data.date),
        department: data.department,
        category: data.category,
        vendor: data.vendor,
        location: data.location,
        businessUnit: data.businessUnit,
        budget: data.budget,
        actualSpend: data.actualSpend,
        status: data.status,
        priority: data.priority,
        paymentMethod: data.paymentMethod,
      },
    });
    res.status(201).json(enrichRecord(record));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create record' });
  }
};

// PATCH /api/spend/:id
export const updateSpendRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    const result = patchSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const data = result.data;
    const updateData: any = { ...data };
    if (data.date) updateData.date = new Date(data.date);

    const record = await prisma.spendRecord.update({
      where: { id },
      data: updateData,
    });
    res.json(enrichRecord(record));
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to update record' });
  }
};

// DELETE /api/spend/:id
export const deleteSpendRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }
    await prisma.spendRecord.delete({ where: { id } });
    res.json({ message: 'Record deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to delete record' });
  }
};
