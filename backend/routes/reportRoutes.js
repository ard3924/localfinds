const express = require('express');
const router = express.Router();
const Report = require('../models/reportModel');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Create a report
router.post('/', protect, async (req, res) => {
    try {
        const { productId, note } = req.body;

        if (!productId || !note) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and note are required'
            });
        }

        const report = new Report({
            product: productId,
            reporter: req.user.id,
            note: note.trim()
        });

        await report.save();

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            report
        });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit report'
        });
    }
});

// Get all reports (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('product', 'name images price')
            .populate('reporter', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            reports
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports'
        });
    }
});

// Delete a report (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.json({
            success: true,
            message: 'Report deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete report'
        });
    }
});

module.exports = router;
