import { PlaceholderPage } from '@/components/placeholder-page';

export default function NotificationsPage() {
  return (
    <PlaceholderPage
      title="Thông báo"
      description="Cảnh báo tồn kho thấp, sự kiện hệ thống và thông báo chưa đọc."
      apiHint="GET /notifications · PATCH /:id/read · PATCH /read-all"
    />
  );
}
