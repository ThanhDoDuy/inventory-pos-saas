'use client';

interface ChartPoint {
  label: string;
  value: number;
}

interface SalesChartProps {
  data?: ChartPoint[];
  emptyMessage?: string;
}

export function SalesChart({
  data = [],
  emptyMessage = 'Chưa có dữ liệu doanh thu',
}: SalesChartProps) {
  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-secondary/50 rounded-lg">
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full h-64 flex items-end justify-between gap-2 p-4 bg-secondary/50 rounded-lg">
      {data.map((item, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer min-w-0">
          <div
            className="w-full bg-primary rounded-t opacity-70 hover:opacity-100 transition-opacity group-hover:bg-primary/90"
            style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: '20px' }}
          />
          <p className="text-xs text-muted-foreground font-medium truncate w-full text-center">
            {item.label}
          </p>
          <p className="text-xs font-semibold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {new Intl.NumberFormat('vi-VN').format(item.value)}₫
          </p>
        </div>
      ))}
    </div>
  );
}

interface BreakdownItem {
  name: string;
  value: number;
}

interface CategoryBreakdownProps {
  items?: BreakdownItem[];
  emptyMessage?: string;
}

export function CategoryBreakdown({
  items = [],
  emptyMessage = 'Chưa có dữ liệu sản phẩm',
}: CategoryBreakdownProps) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm py-8 text-center">{emptyMessage}</p>;
  }

  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-orange-500'];

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const percent = Math.round((item.value / total) * 100);
        return (
          <div key={idx}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
              <p className="text-sm font-bold text-foreground">{percent}%</p>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full ${colors[idx % colors.length]}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
