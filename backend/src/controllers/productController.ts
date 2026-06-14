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

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { uid, name, price, weight, stock, category } = req.body;

    if (!uid || !name || price === undefined || weight === undefined || stock === undefined || !category) {
      return res.status(400).json({ error: 'Please enter all required product details including stock.' });
    }

    const saved = await dbService.createProduct({
      uid,
      name,
      price: Number(price),
      weight: Number(weight),
      stock: Number(stock),
      category,
    });

    emitNotification({
      type: 'success',
      title: 'Catalog Updated',
      message: `Product ${name} registered.`,
    });

    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { uid, name, price, weight, stock, category } = req.body;

    if (!uid || !name || price === undefined || weight === undefined || stock === undefined || !category) {
      return res.status(400).json({ error: 'Please enter all required product details including stock.' });
    }

    const updated = await dbService.updateProduct(id, {
      uid,
      name,
      price: Number(price),
      weight: Number(weight),
      stock: Number(stock),
      category,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    emitNotification({
      type: 'success',
      title: 'Catalog Updated',
      message: `Product ${name} updated.`,
    });

    res.status(200).json(updated);
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
    const { products } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid bulk import payload. Array required.' });
    }

    console.log(`Processing bulk import of ${products.length} products...`);
    const importedCount = [];

    for (const item of products) {
      const uid = item.uid?.trim();
      const name = item.name?.trim();
      const price = Number(item.price);
      const weight = Number(item.weight) || 100;
      const stock = item.stock !== undefined ? Number(item.stock) : 100;
      const category = item.category?.trim() || 'General';

      if (uid && name && !isNaN(price) && !isNaN(weight)) {
        const existing = await dbService.getProductByRfid(uid);
        if (existing) {
          await dbService.updateProduct(existing._id.toString(), {
            uid,
            name,
            price,
            weight,
            stock,
            category,
          });
        } else {
          await dbService.createProduct({
            uid,
            name,
            price,
            weight,
            stock,
            category,
          });
        }
        importedCount.push(name);
      }
    }

    emitNotification({
      type: 'success',
      title: 'Bulk Import Success',
      message: `Successfully imported ${importedCount.length} items.`,
    });

    res.status(200).json({ success: true, count: importedCount.length });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: error.message });
  }
};
