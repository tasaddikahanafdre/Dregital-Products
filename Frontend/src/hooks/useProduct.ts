import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Product, ProductImage } from '../types';

interface State {
  product: Product | null;
  images: ProductImage[];
  loading: boolean;
  error: string | null;
}

export function useProduct() {
  const [state, setState] = useState<State>({
    product: null,
    images: [],
    loading: true,
    error: null,
  });

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.get<{ product: Product; images: ProductImage[] }>('/product');
      setState({ product: data.product, images: data.images, loading: false, error: null });
    } catch (e) {
      setState({
        product: null,
        images: [],
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load product',
      });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload };
}
