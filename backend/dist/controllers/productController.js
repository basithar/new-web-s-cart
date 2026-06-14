"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkImportProducts = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProducts = void 0;
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
const createProduct = async (req, res) => {
    try {
        const { uid, name, price, weight, stock, category } = req.body;
        if (!uid || !name || price === undefined || weight === undefined || stock === undefined || !category) {
            return res.status(400).json({ error: 'Please enter all required product details including stock.' });
        }
        const saved = await dbService_1.dbService.createProduct({
            uid,
            name,
            price: Number(price),
            weight: Number(weight),
            stock: Number(stock),
            category,
        });
        (0, socketService_1.emitNotification)({
            type: 'success',
            title: 'Catalog Updated',
            message: `Product ${name} registered.`,
        });
        res.status(201).json(saved);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { uid, name, price, weight, stock, category } = req.body;
        if (!uid || !name || price === undefined || weight === undefined || stock === undefined || !category) {
            return res.status(400).json({ error: 'Please enter all required product details including stock.' });
        }
        const updated = await dbService_1.dbService.updateProduct(id, {
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
        (0, socketService_1.emitNotification)({
            type: 'success',
            title: 'Catalog Updated',
            message: `Product ${name} updated.`,
        });
        res.status(200).json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateProduct = updateProduct;
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
                const existing = await dbService_1.dbService.getProductByRfid(uid);
                if (existing) {
                    await dbService_1.dbService.updateProduct(existing._id.toString(), {
                        uid,
                        name,
                        price,
                        weight,
                        stock,
                        category,
                    });
                }
                else {
                    await dbService_1.dbService.createProduct({
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
        (0, socketService_1.emitNotification)({
            type: 'success',
            title: 'Bulk Import Success',
            message: `Successfully imported ${importedCount.length} items.`,
        });
        res.status(200).json({ success: true, count: importedCount.length });
    }
    catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.bulkImportProducts = bulkImportProducts;
