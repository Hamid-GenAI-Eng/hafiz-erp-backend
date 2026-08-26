"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const ProductService_1 = require("../services/ProductService");
class ProductController {
    static async getAllProducts(req, res) {
        try {
            const products = await ProductService_1.ProductService.getAllProducts();
            res.json(products);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
    static async getProductById(req, res) {
        try {
            const product = await ProductService_1.ProductService.getProductById(req.params.id);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json(product);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
    static async createProduct(req, res) {
        try {
            const product = await ProductService_1.ProductService.createProduct(req.body);
            res.status(201).json(product);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
    static async updateProduct(req, res) {
        try {
            const incomingVersion = req.body.version;
            if (!incomingVersion)
                return res.status(400).json({ error: 'Version is required for updates (OCC)' });
            const dataToUpdate = {
                type: req.body.type,
                category: req.body.category,
                name: req.body.name,
                brand: req.body.brand,
                size: req.body.size,
                color: req.body.color,
                location: req.body.location,
                unit: req.body.unit,
                current_qty: req.body.current_qty,
                cost_price: req.body.cost_price,
                sale_price: req.body.sale_price,
                min_alert: req.body.min_alert,
                supplier_id: req.body.supplier_id
            };
            const product = await ProductService_1.ProductService.updateProduct(req.params.id, dataToUpdate, incomingVersion);
            res.json(product);
        }
        catch (err) {
            console.error(err);
            if (err.message.includes('409')) {
                return res.status(409).json({ error: 'Conflict: Product was modified by another device. Please refresh.' });
            }
            res.status(500).json({ error: err.message });
        }
    }
    static async deleteProduct(req, res) {
        try {
            let version = req.body?.version;
            if (!version) {
                const existing = await ProductService_1.ProductService.getProductById(req.params.id);
                if (!existing)
                    return res.status(404).json({ error: 'Product not found' });
                version = existing.version;
            }
            await ProductService_1.ProductService.deleteProduct(req.params.id, version);
            res.json({ success: true });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
}
exports.ProductController = ProductController;
