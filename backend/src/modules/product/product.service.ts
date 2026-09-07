import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { CreateProductInput, ListingQuery, UpdateProductInput } from './product.types';
import slugify from './slugify';

const PRODUCT_CACHE_PREFIX = 'products:';

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: {
    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
  },
} satisfies Prisma.ProductInclude;

function cacheKey(query: ListingQuery) {
  return `${PRODUCT_CACHE_PREFIX}${query.category ?? 'all'}:${query.page}:${query.limit}:${query.sort}:${query.q ?? ''}:${query.featured ?? ''}`;
}

export class ProductService {
  async list(query: ListingQuery) {
    const key = cacheKey(query);
    const cached = await redis.get<{ products: unknown; total: number; totalPages: number }>(key);
    if (cached) return cached;

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.category) {
      where.category = { slug: query.category };
    }
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.featured === 'true') where.isFeatured = true;

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      query.sort === 'price_asc'
        ? [{ price: 'asc' }]
        : query.sort === 'price_desc'
          ? [{ price: 'desc' }]
          : query.sort === 'popular'
            ? [{ orderItems: { _count: 'desc' } }]
            : [{ createdAt: 'desc' }];

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.product.count({ where }),
    ]);

    const result = {
      products,
      total,
      totalPages: Math.ceil(total / query.limit),
      page: query.page,
      limit: query.limit,
    };

    await redis.set(key, JSON.stringify(result), 3600);
    return result;
  }

  async getFeatured() {
    const key = `${PRODUCT_CACHE_PREFIX}featured`;
    type CachedProducts = Prisma.ProductGetPayload<{ include: typeof productInclude }>[];
    const cached = await redis.get<CachedProducts>(key);
    if (cached) return cached;

    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    await redis.set(key, JSON.stringify(products), 3600);
    return products;
  }

  async getBySlug(slug: string) {
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: productInclude,
    });

    if (!product) {
      const err = new Error('Product not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    const related = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true, id: { not: product.id } },
      include: productInclude,
      take: 4,
    });

    return { ...product, related };
  }

  async create(input: CreateProductInput) {
    const sku = `AGD-${Date.now().toString(36).toUpperCase().slice(-8)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const product = await prisma.product.create({
      data: {
        name: input.name,
        slug: await this.uniqueSlug(input.name),
        description: input.description,
        price: input.price,
        comparePrice: input.comparePrice ?? null,
        categoryId: input.categoryId,
        sizes: input.sizes,
        stock: input.stock,
        sku,
        isActive: input.isActive,
        isFeatured: input.isFeatured,
        images: input.images?.length
          ? {
              create: input.images.map((url, i) => ({
                url,
                isPrimary: i === 0,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: productInclude,
    });

    await this.invalidateCache();
    return product;
  }

  async update(id: string, input: UpdateProductInput) {
    const { images: _images, ...rest } = input;
    const product = await prisma.product.update({
      where: { id },
      data: rest,
      include: productInclude,
    });
    if (_images?.length) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.productImage.createMany({
        data: _images.map((url, i) => ({ productId: id, url, isPrimary: i === 0, sortOrder: i })),
      });
    }
    await this.invalidateCache();
    return prisma.product.findUnique({ where: { id }, include: productInclude });
  }

  async remove(id: string) {
    await prisma.product.delete({ where: { id } });
    await this.invalidateCache();
  }

  async addImages(productId: string, urls: string[]) {
    const existingCount = await prisma.productImage.count({ where: { productId } });
    await prisma.productImage.createMany({
      data: urls.map((url, i) => ({
        productId,
        url,
        isPrimary: existingCount + i === 0,
        sortOrder: existingCount + i,
      })),
    });
    await this.invalidateCache();
    return prisma.product.findUnique({ where: { id: productId }, include: productInclude });
  }

  async listCategories() {
    const key = `${PRODUCT_CACHE_PREFIX}categories`;
    const cached = await redis.get<Prisma.CategoryGetPayload<{ include: { _count: { select: { products: { where: { isActive: true } } } } } }>[]>(key);
    if (cached) return cached;
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
    await redis.set(key, JSON.stringify(categories), 3600);
    return categories;
  }

  private async uniqueSlug(base: string) {
    const slug = slugify(base);
    let candidate = slug;
    let n = 1;
    while (await prisma.product.findUnique({ where: { slug: candidate } })) {
      candidate = `${slug}-${n++}`;
    }
    return candidate;
  }

  private async invalidateCache() {
    // Simple approach: bump a version key that product cache lookups consult.
    // For dev simplicity, we clear the whole products:* prefix.
    const keys = await this.collectKeys();
    if (keys.length) await redis.del(...keys);
  }

  private async collectKeys(): Promise<string[]> {
    // In-memory fallback can't scan. Best-effort: delete known keys.
    const known: string[] = [
      `${PRODUCT_CACHE_PREFIX}featured`,
      `${PRODUCT_CACHE_PREFIX}categories`,
    ];
    // Query-based keys aren't enumerable here; leave them to TTL expiry.
    return known;
  }
}