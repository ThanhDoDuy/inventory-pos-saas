'use client';

import { useState } from 'react';
import { Users, Plus, Search, Edit2, History, Ban, Loader2 } from 'lucide-react';
import {
  createCustomer,
  disableCustomer,
  updateCustomer,
  useCustomerHistory,
  useCustomers,
  type CustomerItem,
} from '@/hooks/use-customers';
import {
  formatDateTime,
  formatPrice,
  getPartyStatusLabel,
} from '@/lib/format';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';

const emptyForm = { name: '', phone: '', email: '', address: '' };

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CustomerItem | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { customers, total, isLoading, error, mutate } = useCustomers(
    searchTerm || undefined,
    statusFilter,
  );
  const { history, isLoading: historyLoading } = useCustomerHistory(historyId);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (customer: CustomerItem) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? '',
      address: customer.address ?? '',
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
      };
      if (editing) {
        await updateCustomer(editing.id, payload);
      } else {
        await createCustomer(payload);
      }
      await mutate();
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Thao tác thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async (customer: CustomerItem) => {
    if (!confirm(`Vô hiệu hóa khách hàng "${customer.name}"?`)) return;
    try {
      await disableCustomer(customer.id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể vô hiệu hóa');
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Khách hàng</h1>
          <p className="text-muted-foreground">Quản lý thông tin khách hàng và lịch sử mua hàng</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
        >
          <Plus size={20} />
          Thêm khách hàng
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <FormField label="Tìm kiếm" htmlFor="customer-search">
              <div className="flex items-center gap-2">
                <Search size={20} className="text-muted-foreground shrink-0" />
                <input
                  id="customer-search"
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
            <FormField label="Trạng thái" htmlFor="customer-status">
              <select
                id="customer-status"
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
          <p className="text-center py-12 text-destructive">Không tải được danh sách khách hàng</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Liên hệ</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Mua gần nhất</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      Chưa có khách hàng ({total})
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Users size={18} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            {customer.address && (
                              <p className="text-xs text-muted-foreground">{customer.address}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p>{customer.phone}</p>
                        {customer.email && (
                          <p className="text-muted-foreground">{customer.email}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            customer.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getPartyStatusLabel(customer.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDateTime(customer.last_purchase_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setHistoryId(customer.id)}
                            className="p-2 hover:bg-secondary rounded-lg text-primary"
                            title="Lịch sử mua"
                          >
                            <History size={16} />
                          </button>
                          {customer.status === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => openEdit(customer)}
                                className="p-2 hover:bg-secondary rounded-lg"
                                title="Sửa"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDisable(customer)}
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
              {editing ? 'Sửa khách hàng' : 'Thêm khách hàng'}
            </h2>
            {formError && <p className="text-destructive text-sm mb-4">{formError}</p>}
            <div className="space-y-4 mb-6">
              <FormField label="Tên khách hàng" htmlFor="customer-name" required>
                <input
                  id="customer-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Số điện thoại" htmlFor="customer-phone" required>
                <input
                  id="customer-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Email" htmlFor="customer-email">
                <input
                  id="customer-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Địa chỉ" htmlFor="customer-address">
                <input
                  id="customer-address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
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
            <h2 className="text-xl font-bold mb-4">Lịch sử mua hàng</h2>
            {historyLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="animate-spin" size={18} />
                Đang tải...
              </div>
            ) : history ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số đơn đã mua</span>
                  <span className="font-semibold">{history.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng chi tiêu</span>
                  <span className="font-semibold">{formatPrice(history.total_spent)} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mua gần nhất</span>
                  <span className="font-semibold">
                    {formatDateTime(history.last_purchase_at ?? undefined)}
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
