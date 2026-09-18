import React, { useState } from 'react';
import { Plus, Download, AlertTriangle, RefreshCw } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import SpendTable from '../components/SpendTable';
import RecordFormModal from '../components/RecordFormModal';
import { useSpendRecords } from '../hooks/useSpendRecords';
import { SpendRecord } from '../types';
import { spendApi } from '../api/spend';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function RecordsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useSpendRecords();
  const [modalRecord, setModalRecord] = useState<SpendRecord | null | undefined>(undefined);
  const [deleteRecord, setDeleteRecord] = useState<SpendRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportCsv = () => {
    if (!data?.data || data.data.length === 0) {
      toast.error('No records to export');
      return;
    }

    const headers = [
      'ID',
      'Date',
      'Department',
      'Category',
      'Vendor',
      'Location',
      'Business Unit',
      'Budget',
      'Actual Spend',
      'Savings',
      'Status',
      'Priority',
      'Payment Method',
    ];

    const rows = data.data.map((r) => [
      r.id,
      r.date ? r.date.split('T')[0] : '',
      `"${(r.department || '').replace(/"/g, '""')}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${(r.vendor || '').replace(/"/g, '""')}"`,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${(r.businessUnit || '').replace(/"/g, '""')}"`,
      r.budget,
      r.actualSpend,
      r.savings,
      `"${r.status}"`,
      `"${r.priority}"`,
      `"${r.paymentMethod}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spend_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  };

  const confirmDelete = async () => {
    if (!deleteRecord) return;
    setIsDeleting(true);
    try {
      await spendApi.deleteRecord(deleteRecord.id);
      toast.success(`Record #${deleteRecord.id} deleted`);
      queryClient.invalidateQueries({ queryKey: ['spend-records'] });
      queryClient.invalidateQueries({ queryKey: ['spend-summary'] });
      queryClient.invalidateQueries({ queryKey: ['filter-options'] });
      setDeleteRecord(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete record');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Spend Records</h1>
            {data?.total !== undefined && (
              <span className="badge badge-info text-xs font-mono">
                {data.total} {data.total === 1 ? 'record' : 'records'}
              </span>
            )}
          </div>
          <p className="text-sm text-dark-400 mt-1">
            Browse, search, edit, and manage all organization spend and budget entries
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Export filtered records to CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setModalRecord(null)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <FilterBar />

      {/* Error state */}
      {isError && (
        <div className="card p-6 border-red-500/30 bg-red-500/5 text-center space-y-3">
          <div className="flex justify-center text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-red-200">Failed to load spend records.</p>
          <button
            onClick={() => refetch()}
            className="btn-secondary inline-flex items-center gap-2 text-xs py-1.5 px-3"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Table Component */}
      {!isError && (
        <SpendTable
          data={data?.data || []}
          total={data?.total || 0}
          totalPages={data?.totalPages || 1}
          isLoading={isLoading}
          onEdit={(rec) => setModalRecord(rec)}
          onDelete={(rec) => setDeleteRecord(rec)}
        />
      )}

      {/* Add / Edit Record Modal */}
      {modalRecord !== undefined && (
        <RecordFormModal
          record={modalRecord}
          onClose={() => setModalRecord(undefined)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 border-dark-700 bg-dark-900 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Delete Spend Record</h3>
                <p className="text-xs text-dark-400">Record #{deleteRecord.id} • {deleteRecord.vendor}</p>
              </div>
            </div>

            <p className="text-sm text-dark-300">
              Are you sure you want to permanently delete this record? This action cannot be undone and will update your budget analytics.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-dark-800">
              <button
                type="button"
                onClick={() => setDeleteRecord(null)}
                disabled={isDeleting}
                className="btn-secondary text-sm py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="btn-primary bg-red-600 hover:bg-red-500 focus:ring-red-500 text-white text-sm py-2 px-4"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
