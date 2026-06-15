'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function InventoryProductRedirect() {
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
        ID không hợp lệ.{' '}
        <Link href="/dashboard/products" className="text-primary underline">
          Quay lại danh sách
        </Link>
      </p>
    );
  }

  return (
    <p className="text-muted-foreground text-sm">
      Đang chuyển...{' '}
      <Link href={`/dashboard/products/${productId}`} className="text-primary underline">
        Xem sản phẩm
      </Link>
    </p>
  );
}
