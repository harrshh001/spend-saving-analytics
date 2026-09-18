import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getSpendRecords,
  getSpendSummary,
  getFilterOptions,
  getSpendRecord,
  createSpendRecord,
  updateSpendRecord,
  deleteSpendRecord,
} from '../controllers/spend.controller';

export const spendRouter = Router();

// All spend routes require auth
spendRouter.use(authMiddleware);

// Order matters: specific routes before parameterized ones
spendRouter.get('/summary', getSpendSummary);
spendRouter.get('/filter-options', getFilterOptions);

spendRouter.get('/', getSpendRecords);
spendRouter.post('/', createSpendRecord);
spendRouter.get('/:id', getSpendRecord);
spendRouter.patch('/:id', updateSpendRecord);
spendRouter.delete('/:id', deleteSpendRecord);
