'use client';

import { useMemo, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Eye,
  CheckCircle,
  PackageCheck,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useProducts } from '@/hooks/use-inventory';
import { useSuppliers } from '@/hooks/use-suppliers';
import {
  approvePurchaseOrder,
  cancelPurchaseOrder,
  createPurchaseOrder,
  receivePurchaseOrder,
  usePurchaseOrder,
  usePurchaseOrders,
  type PurchaseOrder,
} from '@/hooks/use-purchase-orders';
import {
  formatDateTime,
  formatPrice,
  getPoStatusColor,
  getPoStatusLabel,
} from '@/lib/format';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';

interface LineItem {
  productId: string;
  quantity: string;
  costPrice: string;
}

const emptyLine = (): LineItem => ({ productId: '', quantity: '1', costPrice: '0' });

export default function PurchaseOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [createForm, setCreateForm] = useState({
    supplierId: '',
    expectedDate: '',
    items: [emptyLine()],
  });

  const { orders, total, isLoading, error, mutate } = usePurchaseOrders(statusFilter);
  const { order: detail, isLoading: detailLoading, mutate: mutateDetail } = usePurchaseOrder(detailId);
  const { suppliers } = useSuppliers(undefined, 'ACTIVE');
  const { products } = useProducts(undefined, 200);

  const supplierMap = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s.name])),
    [suppliers],
  );
  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p.name])),
    [products],
  );

  const [receiveQty, setReceiveQty] = useState<Record<string, string>>({});

  const openDetail = (id: string) => {
    setDetailId(id);
    setReceiveQty({});
    setFormError('');
  };

  const handleCreate = async () => {
    if (!createForm.supplierId) {
      setFormError('Vui lòng chọn nhà cung cấp');
      return;
    }
    const items = createForm.items
      .filter((i) => i.productId)
      .map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        costPrice: Number(i.costPrice),
      }));
    if (items.length === 0) {
      setFormError('Thêm ít nhất một sản phẩm');
      return;
    }
    if (items.some((i) => !i.quantity || i.quantity < 1)) {
      setFormError('Số lượng phải >= 1');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await createPurchaseOrder({
        supplierId: createForm.supplierId,
        items,
        expectedDate: createForm.expectedDate || undefined,
      });
      await mutate();
      setShowCreate(false);
      setCreateForm({ supplierId: '', expectedDate: '', items: [emptyLine()] });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể tạo đơn');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Duyệt đơn nhập hàng này?')) return;
    setIsSubmitting(true);
    try {
      await approvePurchaseOrder(id);
      await mutate();
      await mutateDetail();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Duyệt thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceive = async (order: PurchaseOrder) => {
    const items = (order.items ?? [])
      .filter((i) => i.remaining_quantity > 0)
      .map((i) => ({
        productId: i.productId,
        receivedQuantity: Number(receiveQty[i.productId] ?? i.remaining_quantity),
      }))
      .filter((i) => i.receivedQuantity > 0);

    if (items.length === 0) {
      setFormError('Nhập số lượng nhận hàng');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await receivePurchaseOrder(order.id, items);
      await mutate();
      await mutateDetail();
      setReceiveQty({});
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Nhận hàng thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Lý do hủy đơn:');
    if (!reason?.trim()) return;
    setIsSubmitting(true);
    try {
      await cancelPurchaseOrder(id, reason.trim());
      await mutate();
      await mutateDetail();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Hủy đơn thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLine = () => {
    setCreateForm((f) => ({ ...f, items: [...f.items, emptyLine()] }));
  };

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    setCreateForm((f) => ({
      ...f,
      items: f.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const removeLine = (index: number) => {
    setCreateForm((f) => ({
      ...f,
      items: f.items.length > 1 ? f.items.filter((_, i) => i !== index) : f.items,
    }));
  };

  const canApprove = detail?.status === 'DRAFT';
  const canReceive =
    detail?.status === 'APPROVED' || detail?.status === 'PARTIALLY_RECEIVED';
  const canCancel =
    detail?.status === 'DRAFT' || detail?.status === 'APPROVED';

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Nhập hàng</h1>
          <p className="text-muted-foreground">Tạo, duyệt, nhận hàng và theo dõi đơn mua</p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setShowCreate(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
        >
          <Plus size={20} />
          Tạo đơn nhập
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <FormField label="Lọc trạng thái" htmlFor="po-status">
          <select
            id="po-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${selectClassName} max-w-xs`}
          >
            <option value="all">Tất cả</option>
            <option value="DRAFT">Nháp</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="PARTIALLY_RECEIVED">Nhận một phần</option>
            <option value="RECEIVED">Đã nhận</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </FormField>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            Đang tải...
          </div>
        ) : error ? (
          <p className="text-center py-12 text-destructive">Không tải được danh sách đơn</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Mã đơn</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Nhà cung cấp</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Tổng tiền</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Ngày tạo</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Chưa có đơn nhập hàng ({total})
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-6 py-4 font-medium">{order.po_number}</td>
                      <td className="px-6 py-4 text-sm">
                        {supplierMap.get(order.supplierId) ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPoStatusColor(order.status)}`}
                        >
                          {getPoStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">
                        {formatPrice(order.total_amount)} đ
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openDetail(order.id)}
                          className="p-2 hover:bg-secondary rounded-lg text-primary"
                          title="Chi tiết"
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
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-lg border border-border p-8 max-w-2xl w-full my-8">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={22} className="text-primary" />
              <h2 className="text-xl font-bold">Tạo đơn nhập hàng</h2>
            </div>
            {formError && <p className="text-destructive text-sm mb-4">{formError}</p>}
            <div className="space-y-4 mb-6">
              <FormField label="Nhà cung cấp" htmlFor="po-supplier" required>
                <select
                  id="po-supplier"
                  value={createForm.supplierId}
                  onChange={(e) => setCreateForm({ ...createForm, supplierId: e.target.value })}
                  className={selectClassName}
                >
                  <option value="">— Chọn nhà cung cấp —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Ngày dự kiến nhận" htmlFor="po-expected">
                <input
                  id="po-expected"
                  type="date"
                  value={createForm.expectedDate}
                  onChange={(e) => setCreateForm({ ...createForm, expectedDate: e.target.value })}
                  className={inputClassName}
                />
              </FormField>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sản phẩm</span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-sm text-primary hover:underline"
                  >
                    + Thêm dòng
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-2 mb-2 px-0.5">
                  <div className="col-span-5 text-sm font-medium text-foreground">Sản phẩm</div>
                  <div className="col-span-2 text-sm font-medium text-foreground">Số lượng</div>
                  <div className="col-span-3 text-sm font-medium text-foreground">Giá nhập</div>
                  <div className="col-span-2" />
                </div>
                <div className="space-y-3">
                  {createForm.items.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <select
                          value={line.productId}
                          onChange={(e) => updateLine(index, { productId: e.target.value })}
                          className={selectClassName}
                        >
                          <option value="">Sản phẩm</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          placeholder="1"
                          aria-label="Số lượng"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, { quantity: e.target.value })}
                          className={inputClassName}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          aria-label="Giá nhập"
                          value={line.costPrice}
                          onChange={(e) => updateLine(index, { costPrice: e.target.value })}
                          className={inputClassName}
                        />
                      </div>
                      <div className="col-span-2">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="w-full py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 border border-border rounded-lg font-semibold hover:bg-secondary"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo đơn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-lg border border-border p-8 max-w-2xl w-full my-8">
            {detailLoading || !detail ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <Loader2 className="animate-spin" size={20} />
                Đang tải chi tiết...
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">{detail.po_number}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {supplierMap.get(detail.supplierId)} ·{' '}
                      {formatDateTime(detail.created_at)}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPoStatusColor(detail.status)}`}
                  >
                    {getPoStatusLabel(detail.status)}
                  </span>
                </div>

                {formError && <p className="text-destructive text-sm mb-4">{formError}</p>}

                <div className="border border-border rounded-lg overflow-hidden mb-6">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-4 py-2 text-left">Sản phẩm</th>
                        <th className="px-4 py-2 text-right">SL đặt</th>
                        <th className="px-4 py-2 text-right">Đã nhận</th>
                        <th className="px-4 py-2 text-right">Giá vốn</th>
                        {canReceive && <th className="px-4 py-2 text-right">Nhận lần này</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.items ?? []).map((item) => (
                        <tr key={item.id} className="border-t border-border">
                          <td className="px-4 py-2">
                            {productMap.get(item.productId) ?? item.productId.slice(-6)}
                          </td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">{item.received_quantity}</td>
                          <td className="px-4 py-2 text-right">
                            {formatPrice(item.cost_price)} đ
                          </td>
                          {canReceive && item.remaining_quantity > 0 && (
                            <td className="px-4 py-2 text-right">
                              <input
                                type="number"
                                min={1}
                                max={item.remaining_quantity}
                                className={`${inputClassName} w-20 text-right`}
                                placeholder={String(item.remaining_quantity)}
                                value={receiveQty[item.productId] ?? ''}
                                onChange={(e) =>
                                  setReceiveQty({ ...receiveQty, [item.productId]: e.target.value })
                                }
                              />
                            </td>
                          )}
                          {canReceive && item.remaining_quantity <= 0 && (
                            <td className="px-4 py-2 text-right text-muted-foreground">—</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-right font-semibold mb-6">
                  Tổng: {formatPrice(detail.total_amount)} đ
                </p>

                <div className="flex flex-wrap gap-2">
                  {canApprove && (
                    <button
                      onClick={() => handleApprove(detail.id)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      <CheckCircle size={16} />
                      Duyệt
                    </button>
                  )}
                  {canReceive && (
                    <button
                      onClick={() => handleReceive(detail)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      <PackageCheck size={16} />
                      Nhận hàng
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={() => handleCancel(detail.id)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Hủy đơn
                    </button>
                  )}
                  <button
                    onClick={() => setDetailId(null)}
                    className="ml-auto px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-secondary"
                  >
                    Đóng
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
