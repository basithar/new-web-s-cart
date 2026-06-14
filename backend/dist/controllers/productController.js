"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkImportProducts = exports.deleteProduct = exports.createOrUpdateProduct = exports.getProducts = void 0;
const dbService_1 = require("../services/dbService");
const socketService_1 = require("../services/socketService");
const getProducts = async (req, res) => {
    try {
        const products = await dbService_1.dbService.getProducts();
        res.status(200).json(products);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getProducts = getProducts;
const createOrUpdateProduct = async (req, res) => {
    try {
        const { _id, rfidUid, productName, price, weight, expiryDate, category, image, stockQuantity } = req.body;
        if (!rfidUid || !productName || price === undefined || weight === undefined || !expiryDate || !category || !image || stockQuantity === undefined) {
            return res.status(400).json({ error: 'Please enter all required product details including stock quantity.' });
        }
        const saved = await dbService_1.dbService.upsertProduct({
            _id,
            rfidUid,
            productName,
            price: Number(price),
            weight: Number(weight),
            expiryDate,
            category,
            image,
            stockQuantity: Number(stockQuantity),
        });
        (0, socketService_1.emitNotification)({
            type: 'success',
            title: 'Catalog Updated',
            message: `Product ${productName} registered.`,
        });
        res.status(200).json(saved);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createOrUpdateProduct = createOrUpdateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await dbService_1.dbService.deleteProduct(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        (0, socketService_1.emitNotification)({
            type: 'warning',
            title: 'Catalog Modified',
            message: 'Item removed from database.',
        });
        res.status(200).json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteProduct = deleteProduct;
const bulkImportProducts = async (req, res) => {
    try {
        const { products } = req.body; // Expects JSON array parsed from CSV
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ error: 'Invalid bulk import payload. Array required.' });
        }
        console.log(`Processing bulk import of ${products.length} products...`);
        const importedCount = [];
        for (const item of products) {
            if (item.rfidUid && item.productName && item.price !== undefined) {
                await dbService_1.dbService.upsertProduct({
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
        (0, socketService_1.emitNotification)({
            type: 'success',
            title: 'Bulk Import Success',
            message: `Successfully imported ${importedCount.length} items from CSV.`,
        });
        res.status(200).json({ success: true, count: importedCount.length });
    }
    catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.bulkImportProducts = bulkImportProducts;
