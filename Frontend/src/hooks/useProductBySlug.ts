import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Product, ProductImage } from '../types';

interface State {
  product: Product | null;
  images: ProductImage[];
  loading: boolean;
  error: string | null;
}

export function useProductBySlug(slug: string | undefined) {
  const [state, setState] = useState<State>({
    product: null,
    images: [],
    loading: true,
    error: null,
  });

  const reload = useCallback(async () => {
    if (!slug) {
      setState({ product: null, images: [], loading: false, error: 'No product slug provided' });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.get<{ product: Product; images: ProductImage[] }>(
        `/products/${encodeURIComponent(slug)}`,
      );
      setState({ product: data.product, images: data.images, loading: false, error: null });
    } catch (e) {
      setState({
        product: null,
        images: [],
        loading: false,
        error: e instanceof Error ? e.message : 'Product not found',
      });
    }
  }, [slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload };
}
