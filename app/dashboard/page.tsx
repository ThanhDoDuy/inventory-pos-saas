'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useDashboard } from '@/hooks/use-analytics';
import { DollarSign, ShoppingCart, Package, AlertTriangle, Loader2 } from 'lucide-react';

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { dashboard, isLoading, error } = useDashboard();

  const stats = [
    {
      title: 'Doanh thu hôm nay',
      value: dashboard ? `${formatPrice(dashboard.revenue_today)}₫` : '—',
      icon: DollarSign,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Đơn hôm nay',
      value: dashboard ? String(dashboard.orders_today) : '—',
      icon: ShoppingCart,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'SP bán hôm nay',
      value: dashboard ? String(dashboard.products_sold_today) : '—',
      icon: Package,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Sắp hết hàng',
      value: dashboard ? String(dashboard.low_stock_count) : '—',
      icon: AlertTriangle,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Xin chào, {user?.username}!
        </h1>
        <p className="text-muted-foreground">
          Tổng quan kinh doanh{user?.tenantName ? ` — ${user.tenantName}` : ''}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground mb-6">
          <Loader2 className="animate-spin" size={20} />
          Đang tải dữ liệu...
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive text-sm">Không tải được dữ liệu dashboard</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Top sản phẩm</h2>
          {!dashboard?.top_products?.length ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chưa có dữ liệu bán hàng</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.top_products.map((product, index) => (
                <div
                  key={product.product_id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {index + 1}. {product.product_name ?? product.sku ?? product.product_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Đã bán: {product.quantity_sold}
                    </p>
                  </div>
                  <p className="font-semibold text-primary">
                    {formatPrice(product.revenue)}₫
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Thao tác nhanh</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/pos"
              className="block w-full p-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-center"
            >
              Bán hàng
            </Link>
            <Link
              href="/dashboard/products"
              className="block w-full p-3 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors text-center"
            >
              Quản lý sản phẩm
            </Link>
            <Link
              href="/dashboard/reports"
              className="block w-full p-3 border border-border text-foreground rounded-lg font-semibold hover:bg-secondary transition-colors text-center"
            >
              Xem báo cáo
            </Link>
          </div>

          {dashboard && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-1">Doanh thu tháng</p>
              <p className="text-xl font-bold text-foreground">
                {formatPrice(dashboard.revenue_month)}₫
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
