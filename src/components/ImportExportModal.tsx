'use client';

import React, { useRef, useState } from 'react';
import { X, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { exportAllData, importDataFromJson, exportToCsv } from '@/lib/storage';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: () => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onDataImported,
  onNotify,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  const handleExportJson = async () => {
    try {
      await exportAllData();
      onNotify('success', 'Backup downloaded');
    } catch {
      onNotify('error', 'Failed to generate backup');
    }
  };

  const handleExportCsv = () => {
    try {
      exportToCsv();
      onNotify('success', 'CSV spreadsheet exported');
    } catch {
      onNotify('error', 'Failed to export CSV');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const result = await importDataFromJson(file);
    setImporting(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (result.success) {
      onNotify('success', `Restored ${result.count} application(s)`);
      onDataImported();
      onClose();
    } else {
      onNotify('error', result.error || 'Failed to import backup');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-[var(--surface)] text-[var(--ink)] rounded-2xl shadow-xl border border-[var(--line)] p-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--line)]">
          <div>
            <h2 className="text-base font-bold tracking-tight">Data Backup & Export</h2>
            <p className="text-xs text-[var(--muted)]">Manage backups or export for spreadsheets</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-[var(--ink)]">Full JSON Backup</h3>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">Includes all jobs and screenshots</p>
            </div>
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--accent-ink)] rounded-lg shrink-0 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-[var(--ink)]">CSV Spreadsheet</h3>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">Compatible with Excel and Sheets</p>
            </div>
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--line)] text-[var(--ink)] rounded-lg shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-[var(--ink)]">Restore from Backup</h3>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">Load a previous JSON backup</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="px-3 py-1.5 text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--line)] text-[var(--ink)] rounded-lg shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {importing ? 'Importing...' : 'Select File'}
            </button>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
