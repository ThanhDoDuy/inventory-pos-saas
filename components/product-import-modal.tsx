'use client';

import { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import {
  confirmProductsImport,
  isAllowedImportFile,
  previewProductsImport,
  type ProductImportPreviewResult,
} from '@/hooks/use-import-export';
import { useTranslation } from '@/lib/i18n/use-translation';

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ProductImportModalProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'upsert' | 'create_only'>('upsert');
  const [preview, setPreview] = useState<ProductImportPreviewResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    failed: number;
    skipped: number;
  } | null>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError('');
    setResult(null);
    setMode('upsert');
  };

  const handleClose = () => {
    if (isLoading) return;
    reset();
    onClose();
  };

  const handleFileChange = (next: File | null) => {
    setError('');
    setPreview(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (!isAllowedImportFile(next)) {
      setFile(null);
      setError(t('importExport.error.invalidFileType'));
      return;
    }
    setFile(next);
  };

  const handlePreview = async () => {
    if (!file) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await previewProductsImport(file, mode);
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('importExport.error.previewFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview?.previewToken) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await confirmProductsImport(preview.previewToken);
      setResult(data);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('importExport.error.importFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={handleClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative bg-card rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">{t('importExport.products.title')}</h2>
          <button type="button" onClick={handleClose} className="p-2 hover:bg-secondary rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              {error}
            </p>
          )}

          {result ? (
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">{t('importExport.products.done')}</p>
              <p>{t('importExport.products.created', { count: result.created })}</p>
              <p>{t('importExport.products.updated', { count: result.updated })}</p>
              <p>{t('importExport.products.skipped', { count: result.skipped })}</p>
              {result.failed > 0 && (
                <p className="text-destructive">
                  {t('importExport.products.failed', { count: result.failed })}
                </p>
              )}
            </div>
          ) : !preview ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">{t('importExport.products.mode')}</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'upsert' | 'create_only')}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                >
                  <option value="upsert">{t('importExport.products.modeUpsert')}</option>
                  <option value="create_only">{t('importExport.products.modeCreateOnly')}</option>
                </select>
              </div>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:bg-secondary/50">
                <Upload size={28} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : t('importExport.products.selectFile')}
                </span>
                <input
                  type="file"
                  accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
              </label>
              <p className="text-xs text-muted-foreground">{t('importExport.products.categoryHint')}</p>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-muted-foreground">{t('importExport.products.total')}</p>
                  <p className="font-bold">{preview.summary.total}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-green-800">{t('importExport.products.valid')}</p>
                  <p className="font-bold text-green-900">{preview.summary.valid}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-red-800">{t('importExport.products.errors')}</p>
                  <p className="font-bold text-red-900">{preview.summary.errors}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-amber-800">{t('importExport.products.newCategories')}</p>
                  <p className="font-bold text-amber-900">{preview.summary.categoriesToCreate}</p>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-secondary sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left">#</th>
                      <th className="px-2 py-2 text-left">SKU</th>
                      <th className="px-2 py-2 text-left">{t('importExport.products.colName')}</th>
                      <th className="px-2 py-2 text-left">{t('importExport.products.colCategory')}</th>
                      <th className="px-2 py-2 text-left">{t('common.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.line} className="border-t border-border">
                        <td className="px-2 py-1.5">{row.line}</td>
                        <td className="px-2 py-1.5">{row.sku}</td>
                        <td className="px-2 py-1.5">{row.name}</td>
                        <td className="px-2 py-1.5">
                          {row.categoryName || '—'}
                          {row.categoryAction === 'WILL_CREATE' && (
                            <span className="ml-1 text-amber-700">+</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          {row.status === 'OK' ? (
                            <span className="text-green-700">{row.action}</span>
                          ) : (
                            <span className="text-destructive" title={row.errors.join(', ')}>
                              {row.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-border flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 py-2 border border-border rounded-lg font-semibold hover:bg-secondary disabled:opacity-50"
          >
            {result ? t('common.close') : t('common.cancel')}
          </button>
          {!result && !preview && (
            <button
              type="button"
              onClick={handlePreview}
              disabled={!file || isLoading}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin" size={16} />}
              {t('importExport.products.preview')}
            </button>
          )}
          {!result && preview && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading || preview.summary.valid === 0}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin" size={16} />}
              {t('importExport.products.confirm', { count: preview.summary.valid })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
