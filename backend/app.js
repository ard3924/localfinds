const express = require('express');
const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const { createServer } = require('http');

// Routes
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

const connectDB = require('./db/connection');
const initializeSocket = require('./socket');

// ======================
// MIDDLEWARES
// ======================

app.use(morgan('dev'));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "res.cloudinary.com"],
    },
  })
);

app.use(express.json());

// IMPORTANT for Render (cookies behind proxy)
app.set("trust proxy", 1);

// ======================
// CORS CONFIG (FIXED)
// ======================

const allowedOrigins = [
  "https://localfinds-two.vercel.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ======================
// SERVER + SOCKET
// ======================

const server = createServer(app);
const io = initializeSocket(server);

// ======================
// ROUTES
// ======================

app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inquiries', inquiryRoutes);

// ======================
// HEALTH CHECK
// ======================

app.get('/', (req, res) => {
  res.send('LocalFinds API is running...');
});

// ======================
// START SERVER
// ======================

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
