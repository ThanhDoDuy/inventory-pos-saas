'use client';

import { PlaceholderPage } from '@/components/placeholder-page';
import { useTranslation } from '@/lib/i18n/use-translation';

export default function NotificationsPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t('notifications.title')}
      description={t('notifications.description')}
      apiHint="GET /notifications · PATCH /:id/read · PATCH /read-all"
    />
  );
}
