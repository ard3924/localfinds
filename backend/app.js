const express = require('express')
const app = express()
require('dotenv').config()
const PORT = process.env.PORT
const helmet = require('helmet')
const morgan = require('morgan')
const cors = require('cors');
const jwt = require('jsonwebtoken');

// const cloudinary = require('cloudinary').v2;
const { createServer } = require('http');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { router: invoiceRoutes } = require('./routes/invoiceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const connectDB = require('./db/connection')
const initializeSocket = require('./socket')
const path = require('path')
app.use(morgan('dev'))
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "res.cloudinary.com"],
    },
  })
);
app.use(express.json())
app.use(cors())
const server = createServer(app);
const io = initializeSocket(server);

const startServer = async () => {
    await connectDB();
    server.listen(PORT, () => {
        console.log(`server is running on port ${PORT}`)
    })
};
app.use('/api/user', userRoutes)
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inquiries', inquiryRoutes);
//for production
app.use(express.static(path.join(__dirname, 'build')));

// This makes sure that any non-API route serves the React app
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

startServer();
