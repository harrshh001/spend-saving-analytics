import { Prisma } from '@prisma/client';

export interface FilterParams {
  dateFrom?: string;
  dateTo?: string;
  businessUnit?: string | string[];
  category?: string | string[];
  vendor?: string | string[];
  location?: string | string[];
  status?: string | string[];
  search?: string;
}

function toArray(val: string | string[] | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.flatMap((v) => v.split(','));
  return val.split(',');
}

export function buildWhereClause(params: FilterParams): Prisma.SpendRecordWhereInput {
  const where: Prisma.SpendRecordWhereInput = {};

  // Date range
  if (params.dateFrom || params.dateTo) {
    where.date = {};
    if (params.dateFrom) (where.date as any).gte = new Date(params.dateFrom);
    if (params.dateTo) (where.date as any).lte = new Date(params.dateTo + 'T23:59:59.999Z');
  }

  // Multi-select filters
  const businessUnits = toArray(params.businessUnit);
  if (businessUnits.length > 0) where.businessUnit = { in: businessUnits };

  const categories = toArray(params.category);
  if (categories.length > 0) where.category = { in: categories };

  const vendors = toArray(params.vendor);
  if (vendors.length > 0) where.vendor = { in: vendors };

  const locations = toArray(params.location);
  if (locations.length > 0) where.location = { in: locations };

  const statuses = toArray(params.status);
  if (statuses.length > 0) where.status = { in: statuses };

  // Search across text fields
  if (params.search && params.search.trim()) {
    const search = params.search.trim();
    where.OR = [
      { department: { contains: search } },
      { category: { contains: search } },
      { vendor: { contains: search } },
      { location: { contains: search } },
      { businessUnit: { contains: search } },
      { status: { contains: search } },
    ];
  }

  return where;
}
