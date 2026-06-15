import { Sidebar } from '@/components/sidebar';
import { AuthGuard } from '@/components/auth-guard';
import { DashboardTopBar } from '@/components/dashboard-top-bar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 md:ml-64">
          <DashboardTopBar />
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
