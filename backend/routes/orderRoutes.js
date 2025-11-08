const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Invoice = require('../models/invoiceModel');
const User = require('../models/userModel');
const { protect } = require('../middleware/authMiddleware');
const pdfGenerator = require('../utils/pdfGenerator');
const { generateInvoiceForOrder } = require('./invoiceRoutes');

/**
 * @route   POST /api/orders
 * @desc    Create a new order from cart items
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
    // Check if user is a seller - sellers cannot place orders
    if (req.user.role === 'seller') {
        return res.status(403).json({ message: 'Sellers cannot place orders. Please sign in as a buyer to purchase products.' });
    }

    const { items, shippingAddress, paymentMethod, orderNotes } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items in the order' });
    }

    if (!shippingAddress) {
        return res.status(400).json({ message: 'Shipping address is required' });
    }

    try {
        let totalAmount = 0;
        const orderItems = [];

        // Validate and calculate items
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.product} not found` });
            }

            if (product.seller.toString() === req.user.id) {
                return res.status(400).json({ message: 'Cannot order your own product' });
            }

            const price = product.price; // Use current price
            const itemTotal = price * item.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                product: item.product,
                quantity: item.quantity,
                price: price,
            });
        }

        const order = new Order({
            user: req.user.id,
            items: orderItems,
            totalAmount,
            shippingAddress,
            paymentMethod: paymentMethod || 'cash_on_delivery',
            orderNotes,
            trackingHistory: [{
                status: 'pending',
                timestamp: new Date(),
                note: 'Order placed successfully'
            }],
        });

        await order.save();

        // Fetch populated order for invoice generation
        const populatedOrder = await Order.findById(order._id).populate('items.product', 'name images price seller');

        // Generate invoice immediately after order creation
        try {
            const invoice = await generateInvoiceForOrder(populatedOrder);
            console.log('Invoice generated for new order:', invoice.invoiceNumber);
        } catch (invoiceError) {
            console.error('Error generating invoice for new order:', invoiceError);
            // Don't fail the order creation if invoice generation fails
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/orders/myorders
 * @desc    Get current user's orders
 * @access  Private
 */
router.get('/myorders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('items.product', 'name images price category')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/orders/seller
 * @desc    Get orders where user is the seller of products
 * @access  Private (Sellers only)
 */
router.get('/seller', protect, async (req, res) => {
    try {
        // Check if user is a seller
        if (req.user.role !== 'seller') {
            return res.status(403).json({ message: 'Access denied. Sellers only.' });
        }

        // Find orders where the seller is the seller of at least one product in the order
        const orders = await Order.find({
            'items.product': {
                $in: await Product.find({ seller: req.user.id }).distinct('_id')
            }
        })
            .populate('items.product', 'name images price category')
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get a single order by ID
 * @access  Private (Order owner only)
 */
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product', 'name images price category description')
            .populate('user', 'name email phone address');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({
            success: true,
            order,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status (for admin/seller)
 * @access  Private (Admin or Seller of products in order)
 */
router.put('/:id/status', protect, async (req, res) => {
    const { status, trackingNumber, carrier, estimatedDelivery, note } = req.body;

    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const order = await Order.findById(req.params.id).populate('items.product');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is admin or seller of any product in the order
        const isAdmin = req.user.role === 'admin';
        const isSeller = order.items.some(item => item.product.seller.toString() === req.user.id);

        if (!isAdmin && !isSeller) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Update tracking information if provided
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (carrier) order.carrier = carrier;
        if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

        // Add to tracking history
        order.trackingHistory.push({
            status: status,
            timestamp: new Date(),
            note: note || `Order status updated to ${status}`
        });

        // Generate invoice when order is confirmed, shipped, or delivered
        if ((status === 'confirmed' || status === 'shipped' || status === 'delivered') && order.status !== status) {
            try {
                // Check if invoice already exists
                const existingInvoice = await Invoice.findOne({ order: req.params.id });
                if (!existingInvoice) {
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
                } else {
                    console.log('Invoice already exists for order:', req.params.id);
                }
            } catch (invoiceError) {
                console.error('Error generating invoice:', invoiceError);
                // Don't fail the order update if invoice generation fails
            }
        }

        // Cancel invoice when order is cancelled
        if (status === 'cancelled' && order.status !== 'cancelled') {
            try {
                const invoice = await Invoice.findOne({ order: req.params.id });
                if (invoice && invoice.status === 'active') {
                    invoice.status = 'cancelled';
                    invoice.cancelledAt = new Date();
                    await invoice.save();

                    // Delete the PDF file
                    pdfGenerator.deleteInvoice(invoice.pdfPath);
                }
            } catch (cancelError) {
                console.error('Error cancelling invoice:', cancelError);
                // Don't fail the order update if invoice cancellation fails
            }
        }

        order.status = status;
        if (status === 'delivered') {
            order.deliveredAt = new Date();
        }

        await order.save();

        res.json({
            success: true,
            message: 'Order status updated successfully',
            order,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   DELETE /api/orders/:id
 * @desc    Cancel an order (only if pending)
 * @access  Private (Order owner only)
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Cannot cancel order that is not pending' });
        }

        // Cancel invoice when order is cancelled
        try {
            const invoice = await Invoice.findOne({ order: req.params.id });
            if (invoice && invoice.status === 'active') {
                invoice.status = 'cancelled';
                invoice.cancelledAt = new Date();
                await invoice.save();

                // Delete the PDF file
                pdfGenerator.deleteInvoice(invoice.pdfPath);
            }
        } catch (cancelError) {
            console.error('Error cancelling invoice:', cancelError);
            // Don't fail the order cancellation if invoice cancellation fails
        }

        order.status = 'cancelled';
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
