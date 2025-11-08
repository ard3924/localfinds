const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
    constructor() {
        this.invoicesDir = path.join(__dirname, '../invoices');
        // Ensure invoices directory exists
        if (!fs.existsSync(this.invoicesDir)) {
            fs.mkdirSync(this.invoicesDir, { recursive: true });
        }
    }

    generateInvoice(invoiceData) {
        return new Promise((resolve, reject) => {
            try {
                const { invoice, order, user, seller } = invoiceData;
                const fileName = `invoice_${invoice.invoiceNumber}.pdf`;
                const filePath = path.join(this.invoicesDir, fileName);

                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50
                });

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // Header
                doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
                doc.moveDown();

                // Invoice details
                doc.fontSize(12).font('Helvetica');
                doc.text(`Invoice Number: ${invoice.invoiceNumber}`, { align: 'right' });
                doc.text(`Date: ${new Date(invoice.generatedAt).toLocaleDateString()}`, { align: 'right' });
                doc.moveDown();

                // Company/Seller info
                doc.fontSize(14).font('Helvetica-Bold').text('From:', { underline: true });
                doc.fontSize(12).font('Helvetica');
                doc.text(`Seller: ${seller.name}`);
                doc.text(`Email: ${seller.email}`);
                doc.moveDown();

                // Customer info
                doc.fontSize(14).font('Helvetica-Bold').text('Bill To:', { underline: true });
                doc.fontSize(12).font('Helvetica');
                doc.text(`Customer: ${user.name}`);
                doc.text(`Email: ${user.email}`);
                doc.text(`Shipping Address: ${invoice.shippingAddress}`);
                doc.moveDown();

                // Order details
                doc.fontSize(14).font('Helvetica-Bold').text('Order Details:', { underline: true });
                doc.fontSize(12).font('Helvetica');
                doc.text(`Order ID: ${order._id}`);
                doc.text(`Payment Method: ${invoice.paymentMethod.replace('_', ' ').toUpperCase()}`);
                doc.moveDown();

                // Items table
                const tableTop = doc.y;
                const itemX = 50;
                const qtyX = 300;
                const priceX = 400;
                const totalX = 500;

                // Table headers
                doc.fontSize(12).font('Helvetica-Bold');
                doc.text('Item', itemX, tableTop);
                doc.text('Qty', qtyX, tableTop);
                doc.text('Price', priceX, tableTop);
                doc.text('Total', totalX, tableTop);

                // Table line
                doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

                // Table items
                let yPosition = tableTop + 25;
                doc.fontSize(10).font('Helvetica');

                invoice.items.forEach(item => {
                    doc.text(item.name, itemX, yPosition);
                    doc.text(item.quantity.toString(), qtyX, yPosition);
                    doc.text(`$${item.price.toFixed(2)}`, priceX, yPosition);
                    doc.text(`$${item.total.toFixed(2)}`, totalX, yPosition);
                    yPosition += 20;
                });

                // Totals
                yPosition += 10;
                doc.fontSize(12).font('Helvetica-Bold');
                doc.text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, 400, yPosition);
                if (invoice.tax > 0) {
                    yPosition += 20;
                    doc.text(`Tax: $${invoice.tax.toFixed(2)}`, 400, yPosition);
                }
                yPosition += 20;
                doc.text(`Total: $${invoice.totalAmount.toFixed(2)}`, 400, yPosition);

                // Footer
                doc.fontSize(10).font('Helvetica');
                doc.text('Thank you for your business!', 50, 700, { align: 'center' });
                doc.text('LocalFinds - Connecting Local Buyers and Sellers', 50, 720, { align: 'center' });

                doc.end();

                stream.on('finish', () => {
                    resolve(filePath);
                });

                stream.on('error', (error) => {
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    deleteInvoice(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Error deleting invoice PDF:', error);
        }
    }

    getInvoicePath(invoiceNumber) {
        return path.join(this.invoicesDir, `invoice_${invoiceNumber}.pdf`);
    }
}

module.exports = new PDFGenerator();
