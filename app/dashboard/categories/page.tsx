'use client';

import { Tags, Plus, Loader2, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  createCategory,
  deleteCategory,
  updateCategory,
  useCategories,
  type CategoryItem,
} from '@/hooks/use-inventory';
import { FormField, inputClassName } from '@/components/form-field';
import { useTranslation } from '@/lib/i18n/use-translation';

const emptyForm = { name: '', description: '' };

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { categories, isLoading, error, mutate } = useCategories();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (category: CategoryItem) => {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description ?? '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setFormError(t('categories.error.nameRequired'));
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      };
      if (editing) {
        await updateCategory(editing.id, payload);
      } else {
        await createCategory(payload);
      }
      await mutate();
      setShowModal(false);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : editing
            ? t('categories.error.updateFailed')
            : t('categories.error.createFailed'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category: CategoryItem) => {
    if (!confirm(t('categories.confirm.delete', { name: category.name }))) return;
    try {
      await deleteCategory(category.id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('categories.error.deleteFailed'));
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('categories.title')}</h1>
          <p className="text-muted-foreground">{t('categories.subtitle')}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
        >
          <Plus size={20} />
          {t('categories.add')}
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            {t('common.loading')}
          </div>
        ) : error ? (
          <p className="text-center py-12 text-destructive">{t('categories.error.loadFailed')}</p>
        ) : categories.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">{t('categories.empty.noCategories')}</p>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-secondary/50"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Tags size={20} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{cat.name}</p>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground truncate">{cat.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="p-2 hover:bg-secondary rounded-lg"
                    title={t('categories.tooltip.edit')}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-2 hover:bg-secondary rounded-lg text-destructive"
                    title={t('categories.tooltip.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editing ? t('categories.modal.edit') : t('categories.modal.add')}
            </h2>
            {formError && <p className="text-destructive text-sm mb-4">{formError}</p>}
            <div className="space-y-4 mb-6">
              <FormField label={t('categories.form.name')} htmlFor="category-name" required>
                <input
                  id="category-name"
                  type="text"
                  placeholder={t('categories.placeholders.name')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('categories.form.description')} htmlFor="category-description">
                <input
                  id="category-description"
                  type="text"
                  placeholder={t('categories.placeholders.description')}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-border rounded-lg font-semibold hover:bg-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                {isSubmitting
                  ? t('common.saving')
                  : editing
                    ? t('common.update')
                    : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
