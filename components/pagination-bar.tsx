'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '@/lib/pagination';
import { useTranslation } from '@/lib/i18n/use-translation';

interface PaginationBarProps {
  pagination?: PaginationMeta | null;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function PaginationBar({
  pagination,
  onPageChange,
  isLoading = false,
  className = '',
}: PaginationBarProps) {
  const { t } = useTranslation();

  if (!pagination || pagination.total_pages <= 1) {
    return null;
  }

  return (
    <div
      className={`px-6 py-4 border-t border-border flex items-center justify-between gap-4 ${className}`}
    >
      <p className="text-sm text-muted-foreground">
        {t('common.pageOf', {
          page: pagination.page,
          totalPages: pagination.total_pages,
        })}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
          disabled={isLoading || pagination.page <= 1}
          className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          {t('common.previous')}
        </button>
        <button
          type="button"
          onClick={() =>
            onPageChange(Math.min(pagination.total_pages, pagination.page + 1))
          }
          disabled={isLoading || pagination.page >= pagination.total_pages}
          className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('common.next')}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
