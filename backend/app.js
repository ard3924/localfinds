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
// const testimonialRoutes = require('./routes/testimonialRoutes');
const adminRoutes = require('./routes/adminRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const connectDB = require('./db/connection')
const initializeSocket = require('./socket')
const path = require('path')
app.use(morgan('dev'))
app.use(cors())
app.use(helmet())
app.use(express.json())

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
// app.use('/api/testimonials', testimonialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inquiries', inquiryRoutes);

startServer();
