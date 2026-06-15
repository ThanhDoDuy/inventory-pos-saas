'use client';

import { Tags, Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCategories } from '@/hooks/use-inventory';
import { apiPost, extractErrorMessage } from '@/lib/api-client';
import { FormField, inputClassName } from '@/components/form-field';

export default function CategoriesPage() {
  const { categories, isLoading, error, mutate } = useCategories();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setFormError('Tên danh mục không được trống');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      await apiPost('/categories', { name, description: description || undefined });
      await mutate();
      setShowModal(false);
      setName('');
      setDescription('');
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Không thể tạo danh mục'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Danh mục sản phẩm</h1>
          <p className="text-muted-foreground">Phân loại sản phẩm trong kho</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
        >
          <Plus size={20} />
          Thêm danh mục
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            Đang tải...
          </div>
        ) : error ? (
          <p className="text-center py-12 text-destructive">Không tải được danh mục</p>
        ) : categories.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">Chưa có danh mục</p>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-4 px-6 py-4 hover:bg-secondary/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tags size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{cat.name}</p>
                  {cat.description && (
                    <p className="text-sm text-muted-foreground">{cat.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Thêm danh mục</h2>
            {formError && (
              <p className="text-destructive text-sm mb-4">{formError}</p>
            )}
            <div className="space-y-4 mb-6">
              <FormField label="Tên danh mục" htmlFor="category-name" required>
                <input
                  id="category-name"
                  type="text"
                  placeholder="Ví dụ: Beverages"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Mô tả" htmlFor="category-description">
                <input
                  id="category-description"
                  type="text"
                  placeholder="Mô tả ngắn (tuỳ chọn)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                {isSubmitting ? 'Đang lưu...' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
