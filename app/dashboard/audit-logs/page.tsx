import { PlaceholderPage } from '@/components/placeholder-page';

export default function AuditLogsPage() {
  return (
    <PlaceholderPage
      title="Nhật ký audit"
      description="Theo dõi hoạt động hệ thống: đăng nhập, thay đổi dữ liệu, xuất báo cáo."
      apiHint="GET /audit-logs · GET /audit-logs/export?format=csv"
    />
  );
}
