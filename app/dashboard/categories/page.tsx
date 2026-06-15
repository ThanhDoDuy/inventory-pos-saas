'use client';

import { Tags, Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCategories } from '@/hooks/use-inventory';
import { apiPost, extractErrorMessage } from '@/lib/api-client';
import { FormField, inputClassName } from '@/components/form-field';
import { useTranslation } from '@/lib/i18n/use-translation';

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { categories, isLoading, error, mutate } = useCategories();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setFormError(t('categories.error.nameRequired'));
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
      setFormError(extractErrorMessage(err, t('categories.error.createFailed')));
    } finally {
      setIsSubmitting(false);
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
          onClick={() => setShowModal(true)}
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
            <h2 className="text-xl font-bold mb-4">{t('categories.modal.add')}</h2>
            {formError && (
              <p className="text-destructive text-sm mb-4">{formError}</p>
            )}
            <div className="space-y-4 mb-6">
              <FormField label={t('categories.form.name')} htmlFor="category-name" required>
                <input
                  id="category-name"
                  type="text"
                  placeholder={t('categories.placeholders.name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('categories.form.description')} htmlFor="category-description">
                <input
                  id="category-description"
                  type="text"
                  placeholder={t('categories.placeholders.description')}
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
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                {isSubmitting ? t('common.saving') : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
