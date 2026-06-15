'use client';

import { useState } from 'react';
import { Truck, Plus, Search, Edit2, History, Ban, Loader2 } from 'lucide-react';
import {
  createSupplier,
  disableSupplier,
  updateSupplier,
  useSupplierHistory,
  useSuppliers,
  type SupplierItem,
} from '@/hooks/use-suppliers';
import {
  formatDateTime,
  formatPrice,
  getPartyStatusLabel,
} from '@/lib/format';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';

const emptyForm = { name: '', phone: '', email: '', address: '', tax_code: '' };

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SupplierItem | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { suppliers, total, isLoading, error, mutate } = useSuppliers(
    searchTerm || undefined,
    statusFilter,
  );
  const { history, isLoading: historyLoading } = useSupplierHistory(historyId);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (supplier: SupplierItem) => {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      tax_code: supplier.tax_code ?? '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setFormError('Vui lòng nhập tên và số điện thoại');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        tax_code: form.tax_code.trim() || undefined,
      };
      if (editing) {
        await updateSupplier(editing.id, payload);
      } else {
        await createSupplier(payload);
      }
      await mutate();
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Thao tác thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async (supplier: SupplierItem) => {
    if (!confirm(`Vô hiệu hóa nhà cung cấp "${supplier.name}"?`)) return;
    try {
      await disableSupplier(supplier.id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể vô hiệu hóa');
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Nhà cung cấp</h1>
          <p className="text-muted-foreground">Quản lý nhà cung cấp và lịch sử giao dịch</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
        >
          <Plus size={20} />
          Thêm nhà cung cấp
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <FormField label="Tìm kiếm" htmlFor="supplier-search">
              <div className="flex items-center gap-2">
                <Search size={20} className="text-muted-foreground shrink-0" />
                <input
                  id="supplier-search"
                  type="text"
                  placeholder="Tên, SĐT hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClassName} flex-1`}
                />
              </div>
            </FormField>
          </div>
          <div className="md:w-48">
            <FormField label="Trạng thái" htmlFor="supplier-status">
              <select
                id="supplier-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectClassName}
              >
                <option value="all">Tất cả</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="DISABLED">Vô hiệu</option>
              </select>
            </FormField>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            Đang tải...
          </div>
        ) : error ? (
          <p className="text-center py-12 text-destructive">Không tải được danh sách nhà cung cấp</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Nhà cung cấp</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Liên hệ</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Mã số thuế</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      Chưa có nhà cung cấp ({total})
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Truck size={18} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            {supplier.address && (
                              <p className="text-xs text-muted-foreground">{supplier.address}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p>{supplier.phone}</p>
                        {supplier.email && (
                          <p className="text-muted-foreground">{supplier.email}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {supplier.tax_code || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            supplier.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getPartyStatusLabel(supplier.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setHistoryId(supplier.id)}
                            className="p-2 hover:bg-secondary rounded-lg text-primary"
                            title="Lịch sử đơn"
                          >
                            <History size={16} />
                          </button>
                          {supplier.status === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => openEdit(supplier)}
                                className="p-2 hover:bg-secondary rounded-lg"
                                title="Sửa"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDisable(supplier)}
                                className="p-2 hover:bg-secondary rounded-lg text-destructive"
                                title="Vô hiệu hóa"
                              >
                                <Ban size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editing ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
            </h2>
            {formError && <p className="text-destructive text-sm mb-4">{formError}</p>}
            <div className="space-y-4 mb-6">
              <FormField label="Tên nhà cung cấp" htmlFor="supplier-name" required>
                <input
                  id="supplier-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Số điện thoại" htmlFor="supplier-phone" required>
                <input
                  id="supplier-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Email" htmlFor="supplier-email">
                <input
                  id="supplier-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Địa chỉ" htmlFor="supplier-address">
                <input
                  id="supplier-address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Mã số thuế" htmlFor="supplier-tax">
                <input
                  id="supplier-tax"
                  value={form.tax_code}
                  onChange={(e) => setForm({ ...form, tax_code: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-border rounded-lg font-semibold hover:bg-secondary"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                {isSubmitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Lịch sử đơn mua</h2>
            {historyLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="animate-spin" size={18} />
                Đang tải...
              </div>
            ) : history ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số đơn mua</span>
                  <span className="font-semibold">{history.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng giá trị</span>
                  <span className="font-semibold">{formatPrice(history.total_amount)} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đơn gần nhất</span>
                  <span className="font-semibold">
                    {formatDateTime(history.last_order_at ?? undefined)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Chưa có dữ liệu</p>
            )}
            <button
              onClick={() => setHistoryId(null)}
              className="w-full mt-6 py-2 border border-border rounded-lg font-semibold hover:bg-secondary"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
