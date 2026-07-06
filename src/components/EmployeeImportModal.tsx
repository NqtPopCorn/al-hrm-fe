import { ChangeEvent, useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';

import Modal from './Modal';
import { EmployeeImportRowError } from '../services/employee.service';

interface EmployeeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  isImporting: boolean;
  errorMessage: string | null;
  rowErrors: EmployeeImportRowError[];
}

export default function EmployeeImportModal({
  isOpen,
  onClose,
  onImport,
  isImporting,
  errorMessage,
  rowErrors,
}: EmployeeImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setLocalError(null);
    }
  }, [isOpen]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setSelectedFile(nextFile);
    setLocalError(null);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setLocalError('Please choose a CSV or Excel file to import.');
      return;
    }

    setLocalError(null);
    try {
      await onImport(selectedFile);
    } catch {
      return;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import employees"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="font-medium text-slate-800">
                Upload a `.csv`, `.xls`, or `.xlsx` file.
              </p>
              <p>
                Required columns: `code`, `fullName`, `personalEmail`,
                `companyEmail`, `phone`, `role`, `departmentCode`,
                `positionTitle`, `workStatus`, `emailStatus`, `joinDate`.
              </p>
              <a
                href="/templates/employee-import-template.csv"
                download
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Download className="h-4 w-4" />
                Download import template
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Import file
          </label>
          <input
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileChange}
            disabled={isImporting}
            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          {selectedFile ? (
            <p className="text-xs text-slate-500">
              Selected: {selectedFile.name}
            </p>
          ) : null}
        </div>

        {localError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {localError}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {rowErrors.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">Import errors</p>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-rose-100 bg-rose-50/60 p-3">
              {rowErrors.map((error, index) => (
                <div
                  key={`${error.row}-${error.field}-${index}`}
                  className="rounded-lg border border-rose-100 bg-white px-3 py-2 text-sm text-rose-700"
                >
                  Row {error.row} - {error.field}: {error.message}
                  {error.value ? ` (${error.value})` : ''}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={isImporting}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import employees'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
