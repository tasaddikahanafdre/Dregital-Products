import { supabase } from '../lib/supabase';
import { HttpError } from '../middleware/error';
import type { ProductImageRow, ProductRow } from '../types/db';

// ── Public queries ────────────────────────────────────────────

/** Fetch a single product by slug plus its images. */
export async function getProductBySlug(slug: string): Promise<{
  product: ProductRow;
  images: ProductImageRow[];
} | null> {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  if (!product) return null;

  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true });

  if (imagesError) throw imagesError;

  return {
    product: product as ProductRow,
    images: (images ?? []) as ProductImageRow[],
  };
}

/** Fetch all active products with their first image (for the shop listing page). */
export async function listActiveProducts(): Promise<Array<ProductRow & { thumbnail_url: string | null }>> {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!products || products.length === 0) return [];

  // Fetch the first image for each product
  const productIds = products.map((p) => p.id);
  const { data: images } = await supabase
    .from('product_images')
    .select('product_id, public_url')
    .in('product_id', productIds)
    .order('sort_order', { ascending: true });

  // Build a map of product_id → first image URL
  const imageMap = new Map<string, string>();
  for (const img of images ?? []) {
    if (!imageMap.has(img.product_id)) {
      imageMap.set(img.product_id, img.public_url);
    }
  }

  return products.map((p) => ({
    ...(p as ProductRow),
    thumbnail_url: imageMap.get(p.id) ?? null,
  }));
}

// ── Admin queries ─────────────────────────────────────────────

/** Fetch all products for the admin dashboard. */
export async function listAllProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProductRow[];
}

/** Fetch a single product by ID plus its images. */
export async function getProductById(productId: string): Promise<{
  product: ProductRow;
  images: ProductImageRow[];
} | null> {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .maybeSingle();

  if (error) throw error;
  if (!product) return null;

  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true });

  if (imagesError) throw imagesError;

  return {
    product: product as ProductRow,
    images: (images ?? []) as ProductImageRow[],
  };
}

/** Create a new product. */
export async function createProduct(
  data: {
    slug: string;
    name: string;
    tagline?: string | null;
    description: string;
    price: number;
    original_price?: number | null;
    active?: boolean;
    seo_title?: string | null;
    seo_description?: string | null;
    features?: string[];
    variants?: Array<{ name: string; options: string[]; priceModifier?: number }>;
    specifications?: Array<{ label: string; value: string }>;
    in_stock?: boolean;
    video_url?: string | null;
    video_type?: 'youtube' | 'facebook' | 'none';
    video_thumbnail_url?: string | null;
  },
): Promise<ProductRow> {
  // Check slug uniqueness
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('slug', data.slug)
    .maybeSingle();

  if (existing) {
    throw new HttpError(409, `A product with slug "${data.slug}" already exists.`);
  }

  // Determine video type from URL if not explicitly set
  let videoType = data.video_type ?? 'none';
  const videoUrl = data.video_url ?? null;
  if (videoUrl) {
    videoType = data.video_type === 'youtube' || data.video_type === 'facebook'
      ? data.video_type
      : videoUrl.includes('facebook.com') ? 'facebook' : 'youtube';
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      slug: data.slug,
      name: data.name,
      tagline: data.tagline ?? null,
      description: data.description,
      price: data.price,
      original_price: data.original_price ?? null,
      currency: 'BDT',
      active: data.active ?? true,
      seo_title: data.seo_title ?? null,
      seo_description: data.seo_description ?? null,
      features: data.features ?? [],
      variants: data.variants ?? [],
      specifications: data.specifications ?? [],
      in_stock: data.in_stock ?? true,
      video_url: videoUrl,
      video_type: videoType,
      video_thumbnail_url: data.video_thumbnail_url ?? null,
    })
    .select()
    .single();

  if (error) throw new HttpError(500, `Failed to create product: ${error.message}`);
  return product as ProductRow;
}

/** Update a product. */
export async function updateProduct(
  productId: string,
  patch: Partial<{
    slug: string;
    name: string;
    tagline: string | null;
    description: string;
    price: number;
    original_price: number | null;
    active: boolean;
    seo_title: string | null;
    seo_description: string | null;
    features: string[];
    variants: Array<{ name: string; options: string[]; priceModifier?: number }>;
    specifications: Array<{ label: string; value: string }>;
    in_stock: boolean;
    video_url: string | null;
    video_type: 'youtube' | 'facebook' | 'none';
    video_thumbnail_url: string | null;
  }>,
): Promise<ProductRow> {
  // Determine video type from URL if video_url is being changed
  if (patch.video_url !== undefined) {
    const url = patch.video_url?.trim() ?? null;
    patch.video_url = url;
    if (url) {
      patch.video_type =
        patch.video_type === 'youtube' || patch.video_type === 'facebook'
          ? patch.video_type
          : url.includes('facebook.com')
            ? 'facebook'
            : 'youtube';
    } else {
      patch.video_type = 'none';
    }
  }

  // If slug is changing, check uniqueness
  if (patch.slug) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', patch.slug)
      .neq('id', productId)
      .maybeSingle();

    if (existing) {
      throw new HttpError(409, `A product with slug "${patch.slug}" already exists.`);
    }
  }

  const { data, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', productId)
    .select()
    .single();

  if (error) throw new HttpError(500, `Failed to update product: ${error.message}`);
  return data as ProductRow;
}

/** Delete a product and its images. */
export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) throw new HttpError(500, `Failed to delete product: ${error.message}`);
}

/** Get product images for a specific product. */
export async function getProductImages(productId: string): Promise<ProductImageRow[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProductImageRow[];
}
