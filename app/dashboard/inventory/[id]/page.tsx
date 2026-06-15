'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/use-translation';

export default function InventoryProductRedirect() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const productId = typeof params.id === 'string' ? params.id : (params.id?.[0] ?? '');

  useEffect(() => {
    if (productId) {
      router.replace(`/dashboard/products/${productId}`);
    }
  }, [productId, router]);

  if (!productId) {
    return (
      <p className="text-muted-foreground text-sm">
        {t('inventory.redirect.invalidId')}{' '}
        <Link href="/dashboard/products" className="text-primary underline">
          {t('common.backToList')}
        </Link>
      </p>
    );
  }

  return (
    <p className="text-muted-foreground text-sm">
      {t('inventory.redirect.redirecting')}{' '}
      <Link href={`/dashboard/products/${productId}`} className="text-primary underline">
        {t('inventory.redirect.viewProduct')}
      </Link>
    </p>
  );
}
