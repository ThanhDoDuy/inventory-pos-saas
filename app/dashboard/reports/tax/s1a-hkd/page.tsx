'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Loader2, Settings } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translation';
import { useTaxS1aHkd } from '@/hooks/use-tax-report';
import { exportS1aHkdToExcel } from '@/lib/export-s1a-hkd';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function TaxS1aHkdPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useTaxS1aHkd(year);

  const isConfigured = data && (data.header.business_name || data.header.tax_code);

  const handleExport = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      await exportS1aHkdToExcel(data, `S1a-HKD-${year}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('reports.taxS1aHkd.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('reports.taxS1aHkd.subtitle')}</p>
      </div>

      {data && !isConfigured && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <Settings size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-800">{t('reports.taxS1aHkd.configMissing')}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard/settings?tab=tax')}
            className="text-sm font-semibold text-amber-700 underline whitespace-nowrap"
          >
            {t('reports.taxS1aHkd.goToSettings')}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="year-select" className="text-sm font-medium text-foreground whitespace-nowrap">
            {t('reports.taxS1aHkd.year')}:
          </label>
          <select
            id="year-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-input rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting || isLoading || !data || data.rows.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {isExporting ? t('reports.taxS1aHkd.exporting') : t('reports.taxS1aHkd.exportExcel')}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="animate-spin" size={18} />
          {t('reports.taxS1aHkd.loading')}
        </div>
      ) : !data || data.rows.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {t('reports.taxS1aHkd.noData')}
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {data.header.business_name && (
            <div className="p-4 border-b border-border bg-secondary/30 text-sm space-y-1">
              <p><span className="font-semibold">HỘ, CÁ NHÂN KINH DOANH:</span> {data.header.business_name}</p>
              {data.header.tax_code && <p><span className="font-semibold">Mã số thuế:</span> {data.header.tax_code}</p>}
              {data.header.business_location && <p><span className="font-semibold">Địa điểm kinh doanh:</span> {data.header.business_location}</p>}
              <p><span className="font-semibold">Kỳ kê khai:</span> Năm {data.header.period}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary text-left">
                  <th className="px-4 py-3 font-semibold text-foreground w-32">
                    {t('reports.taxS1aHkd.table.date')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-foreground">
                    {t('reports.taxS1aHkd.table.transaction')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-foreground text-right w-40">
                    {t('reports.taxS1aHkd.table.amount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, idx) => (
                  <tr
                    key={`${row.date}-${row.label}-${idx}`}
                    className={idx % 2 === 0 ? 'bg-background' : 'bg-secondary/20'}
                  >
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">
                      {row.label}{' '}
                      <span className="text-muted-foreground text-xs">
                        ({row.count} HĐ)
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-foreground">
                      {formatCurrency(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-secondary font-bold">
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-foreground">{t('reports.taxS1aHkd.total')}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {formatCurrency(data.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
