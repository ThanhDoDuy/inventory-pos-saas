'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, Loader2, ScrollText, X } from 'lucide-react';
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  getAuditLog,
  useAuditLogs,
  type AuditLogItem,
} from '@/hooks/use-audit-logs';
import { downloadAuditLogsExport } from '@/hooks/use-import-export';
import { useUsers } from '@/hooks/use-users';
import { FormField, selectClassName } from '@/components/form-field';
import { PaginationBar } from '@/components/pagination-bar';
import type { DateRangePreset } from '@/lib/format';
import { getDateRange } from '@/lib/format';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

function JsonBlock({ value }: { value: Record<string, unknown> | undefined }) {
  if (!value || Object.keys(value).length === 0) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }
  return (
    <pre className="text-xs bg-secondary rounded-lg p-3 overflow-x-auto max-h-48">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function AuditLogsPage() {
  const { t } = useTranslation();
  const { formatDateTime } = useFormat();
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRangePreset>('month');
  const [isExporting, setIsExporting] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AuditLogItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);

  const { from, to } = useMemo(() => getDateRange(dateRange), [dateRange]);

  useEffect(() => {
    setPage(1);
  }, [moduleFilter, actionFilter, dateRange]);

  const { logs, pagination, isLoading, error } = useAuditLogs({
    module: moduleFilter,
    action: actionFilter,
    from,
    to,
    page,
  });
  const { users } = useUsers();

  const userMap = useMemo(
    () => new Map(users.map((u) => [u.id, u.username || u.email])),
    [users],
  );

  const presetLabels: Record<DateRangePreset, string> = {
    week: t('reports.preset.week'),
    month: t('reports.preset.month'),
    quarter: t('reports.preset.quarter'),
    year: t('reports.preset.year'),
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadAuditLogsExport({
        module: moduleFilter,
        action: actionFilter,
        from,
        to,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : t('auditLogs.error.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const data = await getAuditLog(id);
      setDetail(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : t('auditLogs.error.detailFailed'));
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('auditLogs.title')}</h1>
          <p className="text-muted-foreground">{t('auditLogs.description')}</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
          {t('auditLogs.exportCsv')}
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label={t('auditLogs.filter.module')} htmlFor="audit-module">
            <select
              id="audit-module"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="all">{t('auditLogs.filter.all')}</option>
              {AUDIT_MODULES.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('auditLogs.filter.action')} htmlFor="audit-action">
            <select
              id="audit-action"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="all">{t('auditLogs.filter.all')}</option>
              {AUDIT_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('auditLogs.filter.dateRange')} htmlFor="audit-range">
            <select
              id="audit-range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangePreset)}
              className={selectClassName}
            >
              {(Object.keys(presetLabels) as DateRangePreset[]).map((preset) => (
                <option key={preset} value={preset}>
                  {presetLabels[preset]}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        {pagination && (
          <p className="text-sm text-muted-foreground mt-4">
            {t('auditLogs.totalCount', { count: pagination.total })}
          </p>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            {t('common.loading')}
          </div>
        ) : error ? (
          <p className="text-center py-12 text-destructive">{t('auditLogs.error.loadFailed')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('auditLogs.table.time')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('auditLogs.table.user')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('auditLogs.table.action')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('auditLogs.table.module')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('auditLogs.table.entity')}</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">{t('auditLogs.table.status')}</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">{t('auditLogs.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <ScrollText className="mx-auto mb-2 opacity-50" size={32} />
                      {t('auditLogs.empty')}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                        {log.created_at ? formatDateTime(log.created_at) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {log.user_id
                          ? userMap.get(log.user_id) ?? log.user_id.slice(-8)
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{log.action}</td>
                      <td className="px-6 py-4 text-sm">{log.module}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-mono text-xs">
                        {log.entity_id ? log.entity_id.slice(-12) : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            log.status === 'SUCCESS'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => openDetail(log.id)}
                          className="p-2 hover:bg-secondary rounded-lg text-primary"
                          title={t('auditLogs.detail.title')}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar pagination={pagination} onPageChange={setPage} isLoading={isLoading} />
      </div>

      {detailId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-lg border border-border p-8 max-w-2xl w-full my-8">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl font-bold">{t('auditLogs.detail.title')}</h2>
              <button
                type="button"
                onClick={closeDetail}
                className="p-2 hover:bg-secondary rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            {detailLoading || !detail ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <Loader2 className="animate-spin" size={20} />
                {t('common.loading')}
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">{t('auditLogs.table.time')}</p>
                    <p className="font-medium">
                      {detail.created_at ? formatDateTime(detail.created_at) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('auditLogs.table.user')}</p>
                    <p className="font-medium">
                      {detail.user_id
                        ? userMap.get(detail.user_id) ?? detail.user_id
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('auditLogs.table.action')}</p>
                    <p className="font-medium">{detail.action}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('auditLogs.table.module')}</p>
                    <p className="font-medium">{detail.module}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('auditLogs.table.entity')}</p>
                    <p className="font-mono text-xs break-all">{detail.entity_id ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('auditLogs.detail.ip')}</p>
                    <p className="font-medium">{detail.ip_address || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">{t('auditLogs.detail.oldValue')}</p>
                  <JsonBlock value={detail.old_value} />
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">{t('auditLogs.detail.newValue')}</p>
                  <JsonBlock value={detail.new_value} />
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">{t('auditLogs.detail.metadata')}</p>
                  <JsonBlock value={detail.metadata} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
