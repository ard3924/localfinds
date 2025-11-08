const express = require('express');
const router = express.Router();
const Invoice = require('../models/invoiceModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const { protect } = require('../middleware/authMiddleware');
const pdfGenerator = require('../utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

/**
 * Helper function to generate invoice for an order
 * @param {Object} order - The order object
 * @returns {Object} - The created invoice
 */
const generateInvoiceForOrder = async (order) => {
    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ order: order._id });
    if (existingInvoice) {
        return existingInvoice;
    }

    // Get seller info (assuming all items are from the same seller for simplicity)
    const sellerId = order.items[0].product.seller;
    const seller = await User.findById(sellerId, 'name email');
    const user = await User.findById(order.user, 'name email');

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${order._id.toString().slice(-6)}`;

    // Prepare invoice items
    const invoiceItems = order.items.map(item => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
    }));

    // Calculate totals
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const tax = 0; // No tax for now
    const totalAmount = subtotal + tax;

    // Create invoice
    const invoice = new Invoice({
        order: order._id,
        invoiceNumber,
        user: order.user,
        seller: sellerId,
        items: invoiceItems,
        subtotal,
        tax,
        totalAmount,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        pdfPath: `invoices/invoice_${invoiceNumber}.pdf`,
    });

    console.log('Generating PDF for invoice:', invoiceNumber);

    // Generate PDF
    const pdfPath = await pdfGenerator.generateInvoice({
        invoice,
        order,
        user,
        seller,
    });

    console.log('PDF generated at:', pdfPath);

    invoice.pdfPath = pdfPath;
    await invoice.save();

    console.log('Invoice saved successfully:', invoiceNumber);

    return invoice;
};

/**
 * @route   GET /api/invoices/order/:orderId
 * @desc    Get invoice for a specific order
 * @access  Private (Order owner or seller)
 */
router.get('/order/:orderId', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('items.product', 'seller');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is order owner or seller of products in order
        const isOwner = order.user.toString() === req.user.id;
        const isSeller = order.items.some(item =>
            item.product.seller && item.product.seller.toString() === req.user.id
        );

        if (!isOwner && !isSeller) {
            return res.status(403).json({ message: 'Access denied' });
        }

        let invoice = await Invoice.findOne({ order: req.params.orderId })
            .populate('user', 'name email')
            .populate('seller', 'name email')
            .populate('items.product', 'name');

        if (!invoice) {
            // Generate invoice on demand if it doesn't exist
            try {
                const order = await Order.findById(req.params.orderId)
                    .populate('user', 'name email')
                    .populate('items.product', 'name seller images price');

                if (!order) {
                    return res.status(404).json({ message: 'Order not found' });
                }

                // Check permissions again for the order
                const isOwner = order.user._id.toString() === req.user.id;
                const isSeller = order.items.some(item =>
                    item.product.seller && item.product.seller.toString() === req.user.id
                );

                if (!isOwner && !isSeller) {
                    return res.status(403).json({ message: 'Access denied' });
                }

                invoice = await generateInvoiceForOrder(order);
            } catch (genError) {
                console.error('Error generating invoice on demand:', genError);
                return res.status(500).json({ message: 'Failed to generate invoice' });
            }
        }

        res.json({
            success: true,
            invoice,
        });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/invoices/download/:invoiceNumber
 * @desc    Download invoice PDF
 * @access  Private (Invoice owner or seller)
 */
router.get('/download/:invoiceNumber', protect, async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ invoiceNumber: req.params.invoiceNumber });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Check if user is invoice owner or seller
        const isOwner = invoice.user.toString() === req.user.id;
        const isSeller = invoice.seller.toString() === req.user.id;

        if (!isOwner && !isSeller) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const filePath = pdfGenerator.getInvoicePath(invoice.invoiceNumber);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Invoice PDF not found' });
        }

        // Set headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice_${invoice.invoiceNumber}.pdf"`);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Error downloading invoice:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   POST /api/invoices/generate/:orderId
 * @desc    Generate invoice for an order (internal use)
 * @access  Private (Admin/Seller)
 */
router.post('/generate/:orderId', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('user', 'name email')
            .populate('items.product', 'name seller');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is admin or seller of products in order
        const isAdmin = req.user.role === 'admin';
        const isSeller = order.items.some(item => item.product.seller.toString() === req.user.id);

        if (!isAdmin && !isSeller) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const invoice = await generateInvoiceForOrder(order);

        res.json({
            success: true,
            message: 'Invoice generated successfully',
            invoice,
        });
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   PUT /api/invoices/cancel/:orderId
 * @desc    Cancel invoice for an order
 * @access  Private (Admin/Seller)
 */
router.put('/cancel/:orderId', protect, async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ order: req.params.orderId });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Check if user is admin or seller
        const isAdmin = req.user.role === 'admin';
        const isSeller = invoice.seller.toString() === req.user.id;

        if (!isAdmin && !isSeller) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (invoice.status === 'cancelled') {
            return res.status(400).json({ message: 'Invoice is already cancelled' });
        }

        invoice.status = 'cancelled';
        invoice.cancelledAt = new Date();
        await invoice.save();

        // Optionally delete the PDF file
        pdfGenerator.deleteInvoice(invoice.pdfPath);

        res.json({
            success: true,
            message: 'Invoice cancelled successfully',
            invoice,
        });
    } catch (error) {
        console.error('Error cancelling invoice:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = { router, generateInvoiceForOrder };
