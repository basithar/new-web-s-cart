import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { emitNotification } from '../services/socketService';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await dbService.getProducts();
    res.status(200).json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createOrUpdateProduct = async (req: Request, res: Response) => {
  try {
    const { _id, rfidUid, productName, price, weight, expiryDate, category, image, stockQuantity } = req.body;

    if (!rfidUid || !productName || price === undefined || weight === undefined || !expiryDate || !category || !image || stockQuantity === undefined) {
      return res.status(400).json({ error: 'Please enter all required product details including stock quantity.' });
    }

    const saved = await dbService.upsertProduct({
      _id,
      rfidUid,
      productName,
      price: Number(price),
      weight: Number(weight),
      expiryDate,
      category,
      image,
      stockQuantity: Number(stockQuantity),
    } as any);

    emitNotification({
      type: 'success',
      title: 'Catalog Updated',
      message: `Product ${productName} registered.`,
    });

    res.status(200).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await dbService.deleteProduct(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    emitNotification({
      type: 'warning',
      title: 'Catalog Modified',
      message: 'Item removed from database.',
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkImportProducts = async (req: Request, res: Response) => {
  try {
    const { products } = req.body; // Expects JSON array parsed from CSV

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid bulk import payload. Array required.' });
    }

    console.log(`Processing bulk import of ${products.length} products...`);
    const importedCount = [];

    for (const item of products) {
      if (item.rfidUid && item.productName && item.price !== undefined) {
        await dbService.upsertProduct({
          rfidUid: item.rfidUid.trim(),
          productName: item.productName.trim(),
          price: Number(item.price),
          weight: Number(item.weight) || 100,
          expiryDate: item.expiryDate?.trim() || '2026-12-31',
          category: item.category?.trim() || 'General',
          image: item.image?.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300',
        });
        importedCount.push(item.productName);
      }
    }

    emitNotification({
      type: 'success',
      title: 'Bulk Import Success',
      message: `Successfully imported ${importedCount.length} items from CSV.`,
    });

    res.status(200).json({ success: true, count: importedCount.length });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: error.message });
  }
};
