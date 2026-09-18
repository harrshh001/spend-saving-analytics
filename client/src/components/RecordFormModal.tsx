import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { X, Save, Calculator } from 'lucide-react';
import { SpendRecord, SpendRecordInput } from '../types';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { spendApi } from '../api/spend';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const schema = z.object({
  date: z.string().min(1, 'Date is required'),
  department: z.string().min(1, 'Department is required'),
  category: z.string().min(1, 'Category is required'),
  vendor: z.string().min(1, 'Vendor is required'),
  location: z.string().min(1, 'Location is required'),
  businessUnit: z.string().min(1, 'Business Unit is required'),
  budget: z.coerce.number().min(0, 'Budget must be ≥ 0'),
  actualSpend: z.coerce.number().min(0, 'Actual Spend must be ≥ 0'),
  status: z.string().min(1, 'Status is required'),
  priority: z.string().min(1, 'Priority is required'),
  paymentMethod: z.string().min(1, 'Payment Method is required'),
});

type FormData = z.infer<typeof schema>;

interface RecordFormModalProps {
  record?: SpendRecord | null;
  onClose: () => void;
}

function fmt(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

export default function RecordFormModal({ record, onClose }: RecordFormModalProps) {
  const queryClient = useQueryClient();
  const { data: options } = useFilterOptions();
  const isEdit = !!record;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: record ? {
      date: record.date ? format(parseISO(record.date), 'yyyy-MM-dd') : '',
      department: record.department,
      category: record.category,
      vendor: record.vendor,
      location: record.location,
      businessUnit: record.businessUnit,
      budget: record.budget,
      actualSpend: record.actualSpend,
      status: record.status,
      priority: record.priority,
      paymentMethod: record.paymentMethod,
    } : {
      date: format(new Date(), 'yyyy-MM-dd'),
      department: '',
      category: '',
      vendor: '',
      location: '',
      businessUnit: '',
      budget: 0,
      actualSpend: 0,
      status: 'Approved',
      priority: 'Medium',
      paymentMethod: '',
    },
  });

  // Watch for live savings preview
  const budget = watch('budget') || 0;
  const actualSpend = watch('actualSpend') || 0;
  const savings = Number(budget) - Number(actualSpend);
  const savingsPct = Number(budget) > 0 ? (savings / Number(budget)) * 100 : 0;

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && record) {
        await spendApi.updateRecord(record.id, data as SpendRecordInput);
        toast.success('Record updated successfully');
      } else {
        await spendApi.createRecord(data as SpendRecordInput);
        toast.success('Record created successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['spend-records'] });
      queryClient.invalidateQueries({ queryKey: ['spend-summary'] });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to save record';
      toast.error(msg);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const departments = options?.department || ['IT', 'Procurement', 'Marketing', 'Finance', 'HR', 'Operations', 'Facilities', 'Sales'];
  const businessUnits = options?.businessUnit || ['Technology', 'Corporate', 'Marketing', 'Finance', 'People', 'Operations', 'Sales'];
  const locations = options?.location || ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Pune'];
  const statuses = options?.status || ['Approved', 'Over Budget'];
  const priorities = options?.priority || ['High', 'Medium', 'Low'];
  const paymentMethods = options?.paymentMethod || ['Monthly', 'Purchase Order', 'Project', 'Annual Contract', 'Corporate Card'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl glass-card p-6 max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-dark-100">{isEdit ? 'Edit Record' : 'Add New Record'}</h2>
            <p className="text-xs text-dark-500 mt-0.5">{isEdit ? `Editing record #${record?.id}` : 'Fill in all required fields'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-dark-500 hover:text-dark-200 hover:bg-dark-700/50 transition-all">
            <X className="w-4.5 h-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Row 1: Date + Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date <span className="text-red-400">*</span></label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    selected={field.value ? parseISO(field.value) : null}
                    onChange={(d: any) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                    dateFormat="dd MMM yyyy"
                    className={`input-field ${errors.date ? 'border-red-500/50' : ''}`}
                    placeholderText="Select date"
                  />
                )}
              />
              {errors.date && <p className="error-text">{errors.date.message}</p>}
            </div>
            <div>
              <label className="label">Department <span className="text-red-400">*</span></label>
              <select {...register('department')} className={`input-field ${errors.department ? 'border-red-500/50' : ''}`}>
                <option value="">Select department</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <p className="error-text">{errors.department.message}</p>}
            </div>
          </div>

          {/* Row 2: Category + Vendor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category <span className="text-red-400">*</span></label>
              <input
                {...register('category')}
                list="categories-list"
                placeholder="e.g. Cloud Infrastructure"
                className={`input-field ${errors.category ? 'border-red-500/50' : ''}`}
              />
              <datalist id="categories-list">
                {(options?.category || []).map((c) => <option key={c} value={c} />)}
              </datalist>
              {errors.category && <p className="error-text">{errors.category.message}</p>}
            </div>
            <div>
              <label className="label">Vendor <span className="text-red-400">*</span></label>
              <input
                {...register('vendor')}
                list="vendors-list"
                placeholder="e.g. Microsoft Azure"
                className={`input-field ${errors.vendor ? 'border-red-500/50' : ''}`}
              />
              <datalist id="vendors-list">
                {(options?.vendor || []).map((v) => <option key={v} value={v} />)}
              </datalist>
              {errors.vendor && <p className="error-text">{errors.vendor.message}</p>}
            </div>
          </div>

          {/* Row 3: Location + Business Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Location <span className="text-red-400">*</span></label>
              <select {...register('location')} className={`input-field ${errors.location ? 'border-red-500/50' : ''}`}>
                <option value="">Select location</option>
                {locations.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              {errors.location && <p className="error-text">{errors.location.message}</p>}
            </div>
            <div>
              <label className="label">Business Unit <span className="text-red-400">*</span></label>
              <select {...register('businessUnit')} className={`input-field ${errors.businessUnit ? 'border-red-500/50' : ''}`}>
                <option value="">Select business unit</option>
                {businessUnits.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.businessUnit && <p className="error-text">{errors.businessUnit.message}</p>}
            </div>
          </div>

          {/* Row 4: Budget + Actual Spend */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Budget (₹) <span className="text-red-400">*</span></label>
              <input
                {...register('budget')}
                type="number"
                min={0}
                step={100}
                className={`input-field ${errors.budget ? 'border-red-500/50' : ''}`}
              />
              {errors.budget && <p className="error-text">{errors.budget.message}</p>}
            </div>
            <div>
              <label className="label">Actual Spend (₹) <span className="text-red-400">*</span></label>
              <input
                {...register('actualSpend')}
                type="number"
                min={0}
                step={100}
                className={`input-field ${errors.actualSpend ? 'border-red-500/50' : ''}`}
              />
              {errors.actualSpend && <p className="error-text">{errors.actualSpend.message}</p>}
            </div>
          </div>

          {/* Live savings preview */}
          <div className="bg-dark-900/60 rounded-xl p-4 border border-dark-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-primary-400" />
              <p className="text-sm font-medium text-dark-300">Savings Preview</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-dark-500 mb-1">Savings</p>
                <p className={`text-xl font-bold ${savings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmt(savings)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-dark-500 mb-1">Savings %</p>
                <p className={`text-xl font-bold ${savingsPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {savingsPct.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Row 5: Status + Priority + Payment Method */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Status <span className="text-red-400">*</span></label>
              <select {...register('status')} className={`input-field ${errors.status ? 'border-red-500/50' : ''}`}>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.status && <p className="error-text">{errors.status.message}</p>}
            </div>
            <div>
              <label className="label">Priority <span className="text-red-400">*</span></label>
              <select {...register('priority')} className={`input-field ${errors.priority ? 'border-red-500/50' : ''}`}>
                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.priority && <p className="error-text">{errors.priority.message}</p>}
            </div>
            <div>
              <label className="label">Payment Method <span className="text-red-400">*</span></label>
              <select {...register('paymentMethod')} className={`input-field ${errors.paymentMethod ? 'border-red-500/50' : ''}`}>
                <option value="">Select method</option>
                {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              {errors.paymentMethod && <p className="error-text">{errors.paymentMethod.message}</p>}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-dark-700/50">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center" id="modal-submit-btn">
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Update Record' : 'Create Record'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
