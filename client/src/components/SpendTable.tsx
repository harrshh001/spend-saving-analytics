import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  VisibilityState,
  ColumnOrderState,
  ColumnPinningState,
  Column,
  Row,
  Header,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  Eye, Pin, PinOff, GripVertical, Edit2, Trash2, Check, X, Search,
  ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { SpendRecord } from '../types';
import { spendApi } from '../api/spend';
import { useFilters } from '../context/FilterContext';
import toast from 'react-hot-toast';

function fmt(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Approved') return <span className="badge badge-success">{status}</span>;
  if (status === 'Over Budget') return <span className="badge badge-danger">{status}</span>;
  return <span className="badge badge-warning">{status}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'High') return <span className="badge badge-danger">{priority}</span>;
  if (priority === 'Medium') return <span className="badge badge-warning">{priority}</span>;
  return <span className="badge badge-info">{priority}</span>;
}

// Inline editable cell
function InlineEditCell({
  value,
  row,
  field,
  type = 'text',
  onSave,
}: {
  value: string | number;
  row: Row<SpendRecord>;
  field: string;
  type?: string;
  onSave: (id: number, field: string, value: any) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 50);
  };

  const save = async () => {
    const parsed = type === 'number' ? parseFloat(draft) : draft;
    if (isNaN(parsed as any) && type === 'number') { toast.error('Invalid number'); return; }
    if (parsed === value) { setEditing(false); return; }
    await onSave(row.original.id, field, parsed);
    setEditing(false);
  };

  const cancel = () => { setEditing(false); setDraft(String(value)); };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
          onBlur={save}
          className="input-field py-1 px-2 text-xs w-full min-w-[80px]"
          style={{ fontSize: '0.8rem', padding: '2px 6px' }}
        />
        <button onClick={save} className="p-0.5 text-emerald-400 hover:text-emerald-300"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={cancel} className="p-0.5 text-red-400 hover:text-red-300"><X className="w-3.5 h-3.5" /></button>
      </div>
    );
  }

  return (
    <div
      onDoubleClick={startEdit}
      className="group flex items-center gap-1 cursor-pointer hover:text-primary-400 transition-colors"
      title="Double-click to edit"
    >
      <span>{type === 'number' ? fmt(Number(value)) : value}</span>
      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
    </div>
  );
}

// Draggable column header
function DraggableHeader({ header, column, children }: { header: Header<SpendRecord, unknown>; column: Column<SpendRecord, unknown>; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  return (
    <th
      ref={setNodeRef}
      className="table-header-cell relative select-none"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        width: column.getSize(),
        minWidth: column.columnDef.minSize || 80,
        position: column.getIsPinned() ? 'sticky' : undefined,
        left: column.getIsPinned() === 'left' ? `${column.getStart('left')}px` : undefined,
        right: column.getIsPinned() === 'right' ? `${column.getAfter('right')}px` : undefined,
        background: column.getIsPinned() ? '#0f172a' : undefined,
        zIndex: column.getIsPinned() ? 10 : undefined,
      }}
    >
      <div className="flex items-center gap-1">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-dark-600 hover:text-dark-400 mr-0.5 flex-shrink-0">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={column.getToggleSortingHandler()}
          className="flex items-center gap-1 flex-1 text-left hover:text-dark-200 transition-colors"
        >
          {children}
          {column.getIsSorted() === 'asc' ? <ChevronUp className="w-3 h-3" /> :
           column.getIsSorted() === 'desc' ? <ChevronDown className="w-3 h-3" /> :
           <ChevronsUpDown className="w-3 h-3 opacity-30" />}
        </button>
        {/* Resize handle */}
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary-500/50 transition-colors"
        />
      </div>
    </th>
  );
}

interface SpendTableProps {
  data: SpendRecord[];
  total: number;
  totalPages: number;
  isLoading: boolean;
  onEdit: (record: SpendRecord) => void;
  onDelete: (record: SpendRecord) => void;
}

export default function SpendTable({ data, total, totalPages, isLoading, onEdit, onDelete }: SpendTableProps) {
  const queryClient = useQueryClient();
  const { filters, updateFilter } = useFilters();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Local search for client-side filtering within current page
  const [localSearch, setLocalSearch] = useState('');

  // Debounce search update to server
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilter('search', localSearch);
    }, 350);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Sync server-side sorting with TanStack sorting state
  const handleSortingChange = (updaterOrValue: any) => {
    const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue;
    setSorting(newSorting);
    if (newSorting.length > 0) {
      updateFilter('sortBy', newSorting[0].id);
      updateFilter('sortDir', newSorting[0].desc ? 'desc' : 'asc');
    } else {
      updateFilter('sortBy', 'date');
      updateFilter('sortDir', 'desc');
    }
  };

  const handleInlineSave = useCallback(async (id: number, field: string, value: any) => {
    try {
      await spendApi.updateRecord(id, { [field]: value });
      queryClient.invalidateQueries({ queryKey: ['spend-records'] });
      queryClient.invalidateQueries({ queryKey: ['spend-summary'] });
      toast.success('Record updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Update failed');
    }
  }, [queryClient]);

  const columns: ColumnDef<SpendRecord>[] = [
    { accessorKey: 'id', header: 'ID', size: 70, minSize: 60, enableSorting: true, cell: (i) => <span className="text-dark-500 text-xs font-mono">#{i.getValue() as number}</span> },
    { accessorKey: 'date', header: 'Date', size: 110, enableSorting: true, cell: (i) => new Date(i.getValue() as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { accessorKey: 'department', header: 'Department', size: 120, enableSorting: true },
    {
      accessorKey: 'category',
      header: 'Category',
      size: 150,
      enableSorting: true,
      cell: (i) => (
        <InlineEditCell value={i.getValue() as string} row={i.row} field="category" onSave={handleInlineSave} />
      ),
    },
    { accessorKey: 'vendor', header: 'Vendor', size: 160, enableSorting: true },
    { accessorKey: 'location', header: 'Location', size: 110, enableSorting: true },
    { accessorKey: 'businessUnit', header: 'Business Unit', size: 120, enableSorting: true },
    {
      accessorKey: 'budget',
      header: 'Budget',
      size: 120,
      enableSorting: true,
      cell: (i) => <InlineEditCell value={i.getValue() as number} row={i.row} field="budget" type="number" onSave={handleInlineSave} />,
    },
    {
      accessorKey: 'actualSpend',
      header: 'Actual Spend',
      size: 130,
      enableSorting: true,
      cell: (i) => <InlineEditCell value={i.getValue() as number} row={i.row} field="actualSpend" type="number" onSave={handleInlineSave} />,
    },
    {
      accessorKey: 'savings',
      header: 'Savings',
      size: 110,
      enableSorting: false,
      cell: (i) => {
        const v = i.getValue() as number;
        return <span className={v >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmt(v)}</span>;
      },
    },
    {
      accessorKey: 'savingsPercent',
      header: 'Savings %',
      size: 100,
      enableSorting: false,
      cell: (i) => {
        const v = i.getValue() as number;
        return <span className={v >= 0 ? 'text-emerald-400' : 'text-red-400'}>{v.toFixed(1)}%</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      enableSorting: true,
      cell: (i) => <StatusBadge status={i.getValue() as string} />,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      size: 90,
      enableSorting: true,
      cell: (i) => <PriorityBadge priority={i.getValue() as string} />,
    },
    { accessorKey: 'paymentMethod', header: 'Payment Method', size: 150, enableSorting: true },
    {
      id: 'actions',
      header: 'Actions',
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(row.original)}
            className="p-1.5 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
            title="Edit record"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(row.original)}
            className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Delete record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, columnOrder, columnPinning },
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: 'onChange',
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const currentColumnOrder = table.getAllLeafColumns().map((c) => c.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIdx = currentColumnOrder.indexOf(active.id as string);
      const newIdx = currentColumnOrder.indexOf(over.id as string);
      setColumnOrder(arrayMove(currentColumnOrder, oldIdx, newIdx));
    }
  };

  const currentPage = filters.page || 1;
  const currentPageSize = filters.pageSize || 20;

  const goToPage = (page: number) => updateFilter('page', page);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const startRow = total === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
  const endRow = Math.min(currentPage * currentPageSize, total);

  return (
    <div className="flex flex-col gap-4">
      {/* Table toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[340px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 pointer-events-none" />
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search records…"
            className="input-field pl-9 text-sm"
            id="table-global-search"
          />
        </div>

        {/* Column visibility */}
        <div className="relative">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="btn-secondary text-sm py-2"
            id="column-visibility-btn"
          >
            <Eye className="w-4 h-4" />
            Columns
          </button>
          {showColumnMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowColumnMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl py-2 min-w-[200px] animate-fade-in">
                <div className="px-3 py-1.5 text-xs text-dark-500 font-medium uppercase tracking-wide border-b border-dark-700">Toggle Columns</div>
                {table.getAllLeafColumns().filter((c) => c.id !== 'actions').map((col) => (
                  <label key={col.id} className="flex items-center gap-2 px-3 py-2 hover:bg-dark-700/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={col.getIsVisible()}
                      onChange={col.getToggleVisibilityHandler()}
                      className="accent-primary-500"
                    />
                    <span className="text-sm text-dark-200">{String(col.columnDef.header)}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        const isPinned = col.getIsPinned();
                        col.pin(isPinned ? false : 'left');
                      }}
                      className="ml-auto text-dark-500 hover:text-primary-400"
                      title={col.getIsPinned() ? 'Unpin' : 'Pin left'}
                    >
                      {col.getIsPinned() ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="text-sm text-dark-500 ml-auto">
          {total > 0 ? `Showing ${startRow}–${endRow} of ${total} records` : '0 records'}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={currentColumnOrder} strategy={horizontalListSortingStrategy}>
              <table className="w-full border-collapse" style={{ tableLayout: 'fixed', minWidth: `${table.getTotalSize()}px` }}>
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <DraggableHeader key={header.id} header={header} column={header.column}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </DraggableHeader>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {columns.map((_, j) => (
                          <td key={j} className="table-cell">
                            <div className="skeleton h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-16 text-dark-500">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-dark-600" />
                          <p className="text-sm">No records match your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="table-row">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="table-cell"
                            style={{
                              width: cell.column.getSize(),
                              position: cell.column.getIsPinned() ? 'sticky' : undefined,
                              left: cell.column.getIsPinned() === 'left' ? `${cell.column.getStart('left')}px` : undefined,
                              background: cell.column.getIsPinned() ? '#0f172a' : undefined,
                              zIndex: cell.column.getIsPinned() ? 5 : undefined,
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>

        {/* Server-side Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-dark-700/50">
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <span>Rows per page:</span>
            <select
              value={currentPageSize}
              onChange={(e) => { updateFilter('pageSize', Number(e.target.value)); updateFilter('page', 1); }}
              className="input-field py-1 px-2 text-sm"
              style={{ padding: '4px 8px', width: '70px' }}
            >
              {[10, 20, 50, 100].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-dark-400">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
            <div className="flex gap-1">
              <button onClick={() => goToPage(1)} disabled={!canPrev} className="btn-secondary px-2 py-1.5 disabled:opacity-40" title="First page">
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button onClick={() => goToPage(currentPage - 1)} disabled={!canPrev} className="btn-secondary px-2 py-1.5 disabled:opacity-40" title="Previous page">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => goToPage(currentPage + 1)} disabled={!canNext} className="btn-secondary px-2 py-1.5 disabled:opacity-40" title="Next page">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => goToPage(totalPages)} disabled={!canNext} className="btn-secondary px-2 py-1.5 disabled:opacity-40" title="Last page">
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
