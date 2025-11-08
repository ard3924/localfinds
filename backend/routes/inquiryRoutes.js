const express = require('express');
const router = express.Router();
const Inquiry = require('../models/inquiryModel');

// Public route for submitting inquiries
router.post('/', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const inquiry = new Inquiry({
            name,
            email,
            subject,
            message
        });

        await inquiry.save();

        res.status(201).json({
            success: true,
            message: 'Inquiry submitted successfully. We will get back to you soon.',
            inquiryId: inquiry._id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
