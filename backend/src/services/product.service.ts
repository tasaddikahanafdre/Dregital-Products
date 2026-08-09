import { supabase } from '../lib/supabase';
import type { ProductImageRow, ProductRow } from '../types/db';

const DEFAULT_PRODUCT = {
  name: 'Pawsum Signature Product',
  tagline: 'Coming soon — configure your store from the Admin Dashboard.',
  description:
    'Your product description will appear here. Log in to the Admin Dashboard to set the product name, price and images.',
  price: 0,
  original_price: null,
  currency: 'BDT',
  active: true,
};

/**
 * Fetch the single product plus its images (ordered).
 * Creates a placeholder product row on first run so the store works out of the box.
 */
export async function getProductWithImages(): Promise<{
  product: ProductRow;
  images: ProductImageRow[];
}> {
  let { data: product, error } = await supabase
    .from('products')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!product) {
    const { data: created } = await supabase
      .from('products')
      .insert(DEFAULT_PRODUCT)
      .select()
      .single();
    product = created;
  }

  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('*')
    .order('sort_order', { ascending: true });

  if (imagesError) throw imagesError;

  return { product: product as ProductRow, images: (images ?? []) as ProductImageRow[] };
}

export async function updateProduct(
  patch: Partial<Omit<ProductRow, 'id' | 'created_at' | 'updated_at'>>,
): Promise<ProductRow> {
  const { product } = await getProductWithImages();

  const { data, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', product.id)
    .select()
    .single();

  if (error) throw error;
  return data as ProductRow;
}
