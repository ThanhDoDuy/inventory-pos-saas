'use client';

import { PlaceholderPage } from '@/components/placeholder-page';
import { useTranslation } from '@/lib/i18n/use-translation';

export default function AuditLogsPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t('auditLogs.title')}
      description={t('auditLogs.description')}
      apiHint="GET /audit-logs · GET /audit-logs/export?format=csv"
    />
  );
}
