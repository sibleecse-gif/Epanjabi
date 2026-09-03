import { ProductImage } from '@prisma/client';
import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import { ProductService } from './product.service';
import { uploadImages } from '../../middleware/upload.middleware';

const service = new ProductService();

function castUploadedFiles(req: Request): Array<{ filename: string }> {
  const files = (req as Request & { files?: Express.Multer.File[] }).files;
  return (files ?? []).map((f) => ({ filename: f.filename }));
}

export const listProducts = [
  asyncHandler(async (req: Request, res: Response) => {
    const result = await service.list(req.query as never as Parameters<typeof service.list>[0]);
    return ApiResponse.success(res, result);
  }),
];

export const getFeaturedProducts = [
  asyncHandler(async (_req: Request, res: Response) => {
    const products = await service.getFeatured();
    return ApiResponse.success(res, { products });
  }),
];

export const getProductBySlug = [
  asyncHandler(async (req: Request, res: Response) => {
    const product = await service.getBySlug(req.params.slug);
    return ApiResponse.success(res, { product });
  }),
];

export const listCategories = [
  asyncHandler(async (_req: Request, res: Response) => {
    const categories = await service.listCategories();
    return ApiResponse.success(res, { categories });
  }),
];

export const createProduct = [
  authenticate,
  requireAdmin(),
  asyncHandler(async (req: Request, res: Response) => {
    const product = await service.create(req.body);
    return ApiResponse.created(res, { product }, 'Product created');
  }),
];

export const updateProduct = [
  authenticate,
  requireAdmin(),
  asyncHandler(async (req: Request, res: Response) => {
    const product = await service.update(req.params.id, req.body);
    return ApiResponse.success(res, { product }, 'Product updated');
  }),
];

export const deleteProduct = [
  authenticate,
  requireAdmin(),
  asyncHandler(async (req: Request, res: Response) => {
    await service.remove(req.params.id);
    return ApiResponse.success(res, null, 'Product deleted');
  }),
];

export const uploadProductImages = [
  authenticate,
  requireAdmin(),
  uploadImages,
  asyncHandler(async (req: Request, res: Response) => {
    const files = castUploadedFiles(req);
    if (!files.length) return ApiResponse.error(res, 'No images uploaded', 400);

    const base = `${req.protocol}://${req.get('host')}/uploads`;
    const urls = files.map((f) => `${base}/${f.filename}`);
    const product = await service.addImages(req.params.id, urls);
    return ApiResponse.created(res, { product, images: urls }, 'Images uploaded');
  }),
];

export type { ProductImage };