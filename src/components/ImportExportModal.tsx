'use client';

import React, { useRef, useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
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
      onNotify('success', 'Full backup (with screenshots) downloaded!');
    } catch {
      onNotify('error', 'Failed to generate backup file.');
    }
  };

  const handleExportCsv = () => {
    try {
      exportToCsv();
      onNotify('success', 'CSV spreadsheet exported!');
    } catch {
      onNotify('error', 'Failed to export CSV.');
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
      onNotify('success', `Restored ${result.count} application(s) from backup!`);
      onDataImported();
      onClose();
    } else {
      onNotify('error', result.error || 'Failed to import backup.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 dark:bg-sky-950/60 rounded-xl text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/80">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Import & Export</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage your data portability</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Complete JSON Backup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Includes all jobs, notes, and screenshot images.
              </p>
            </div>
            <button
              onClick={handleExportJson}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 rounded-lg shrink-0 transition-opacity flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> CSV Spreadsheet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Open in Excel, Google Sheets, or Notion.
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shrink-0 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-sky-500" /> Restore from JSON
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Load a previously exported JSON backup.
              </p>
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
              className="px-3.5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shrink-0 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {importing ? 'Importing...' : 'Choose File'}
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <span>Restoring from a backup will merge or update jobs with matching IDs and add any new entries.</span>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
