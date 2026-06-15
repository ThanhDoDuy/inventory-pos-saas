'use client';

import { BarChart3, Calendar, Download, TrendingUp, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SalesChart, CategoryBreakdown } from '@/components/sales-chart';
import {
  exportReport,
  useDashboard,
  useLowStock,
  useRevenueByPreset,
  useTopProductsByPreset,
} from '@/hooks/use-analytics';
import { useInvoices } from '@/hooks/use-invoices';
import type { DateRangePreset } from '@/lib/format';
import { formatDateTime, formatPrice, getDateRange } from '@/lib/format';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRangePreset>('month');
  const [isExporting, setIsExporting] = useState(false);

  const { from, to } = useMemo(() => getDateRange(dateRange), [dateRange]);
  const { dashboard } = useDashboard();
  const { revenue, isLoading: revenueLoading } = useRevenueByPreset(dateRange);
  const { products: topProducts, isLoading: topLoading } = useTopProductsByPreset(dateRange, 5);
  const { lowStock, isLoading: lowStockLoading } = useLowStock();
  const { invoices, isLoading: invoicesLoading } = useInvoices(from, to, 20);

  const salesChartData = useMemo(
    () =>
      (revenue?.daily ?? []).map((row) => ({
        label: row._id.slice(5),
        value: row.revenue,
      })),
    [revenue],
  );

  const topProductsBreakdown = useMemo(
    () =>
      topProducts.map((p) => ({
        name: p.product_name ?? p.sku ?? 'SP',
        value: p.revenue,
      })),
    [topProducts],
  );

  const avgOrderValue =
    revenue && revenue.daily.length
      ? revenue.total_revenue /
        revenue.daily.reduce((sum, d) => sum + d.orders, 0)
      : 0;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportReport('REVENUE', { from, to });
    } catch {
      alert('Xuất báo cáo thất bại');
    } finally {
      setIsExporting(false);
    }
  };

  const reportSections = [
    {
      title: 'Tổng quan bán hàng',
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-600',
      loading: revenueLoading,
      stats: [
        {
          label: 'Doanh thu',
          value: revenue ? `${formatPrice(revenue.total_revenue)}₫` : '—',
        },
        {
          label: 'Đơn hàng',
          value: revenue
            ? String(revenue.daily.reduce((sum, d) => sum + d.orders, 0))
            : '—',
        },
        {
          label: 'TB/đơn',
          value: avgOrderValue ? `${formatPrice(Math.round(avgOrderValue))}₫` : '—',
        },
      ],
    },
    {
      title: 'Tồn kho',
      icon: BarChart3,
      color: 'bg-green-100 text-green-600',
      loading: lowStockLoading,
      stats: [
        {
          label: 'Sắp hết hàng',
          value: String(dashboard?.low_stock_count ?? lowStock.length),
        },
        {
          label: 'SP bán hôm nay',
          value: String(dashboard?.products_sold_today ?? '—'),
        },
        {
          label: 'Doanh thu hôm nay',
          value: dashboard ? `${formatPrice(dashboard.revenue_today)}₫` : '—',
        },
      ],
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Báo cáo & Phân tích</h1>
        <p className="text-muted-foreground">Theo dõi hiệu suất kinh doanh</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-muted-foreground" />
            <span className="font-medium text-foreground">Khoảng thời gian:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['week', 'month', 'quarter', 'year'] as DateRangePreset[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors capitalize ${
                  dateRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input text-foreground hover:bg-secondary'
                }`}
              >
                {range === 'week'
                  ? '7 ngày'
                  : range === 'month'
                    ? '1 tháng'
                    : range === 'quarter'
                      ? '3 tháng'
                      : '1 năm'}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="ml-auto flex items-center gap-2 px-4 py-2 border border-input rounded-lg text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <Download size={20} />
            {isExporting ? 'Đang xuất...' : 'Xuất CSV'}
          </button>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {reportSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <div key={index} className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-lg ${section.color}`}>
                  <Icon size={24} />
                </div>
                <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                {section.loading && <Loader2 className="animate-spin text-muted-foreground" size={18} />}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {section.stats.map((stat, idx) => (
                  <div key={idx} className="p-4 border border-border rounded-lg">
                    <p className="text-muted-foreground text-sm mb-2">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">Xu hướng doanh thu</h2>
          {revenueLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={20} />
              Đang tải...
            </div>
          ) : (
            <SalesChart data={salesChartData} />
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">Top sản phẩm theo doanh thu</h2>
          {topLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={20} />
              Đang tải...
            </div>
          ) : (
            <CategoryBreakdown items={topProductsBreakdown} />
          )}
        </div>
      </div>

      <div className="mt-8 bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Giao dịch gần đây</h2>
        </div>
        {invoicesLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={20} />
            Đang tải...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Ngày</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Mã HĐ</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Thanh toán</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Số tiền</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      Không có giao dịch trong khoảng thời gian đã chọn
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDateTime(inv.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {inv.invoice_number ?? inv.id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {inv.payment_method ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-foreground">
                        {formatPrice(inv.total)}₫
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            inv.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
