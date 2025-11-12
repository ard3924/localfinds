const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    note: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Report', reportSchema);
