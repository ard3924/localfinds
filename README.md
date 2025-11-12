# LocalFinds - Local Marketplace Platform

LocalFinds is a comprehensive e-commerce platform that connects local buyers and sellers, enabling them to trade products and services within their communities. The platform features real-time chat, secure authentication, and a user-friendly interface built with modern web technologies.

## 🚀 Features

### User Management
- **Multi-role Authentication**: Support for buyers, sellers, and administrators
- **Secure Registration & Login**: JWT-based authentication with password hashing
- **OTP-based Password Reset**: Secure email verification for password recovery
- **Profile Management**: User profiles with customizable information

### Marketplace
- **Product Listings**: Sellers can create and manage product listings with images
- **Advanced Search & Filtering**: Find products by category, price, location, and more
- **Product Categories**: Organized product browsing by business categories
- **Wishlist**: Save favorite products for later
- **Shopping Cart**: Add products to cart and manage quantities

### Communication
- **Real-time Chat**: Socket.io-powered messaging between buyers and sellers
- **Notifications**: Real-time notifications for messages, orders, and updates
- **In-app Messaging**: Seamless communication within the platform

### Order Management
- **Order Processing**: Complete order lifecycle from placement to delivery
- **Invoice Generation**: Automatic PDF invoice generation for orders
- **Order Tracking**: Track order status and history
- **Payment Integration**: Secure payment processing (ready for integration)

### Seller Dashboard
- **Business Profile**: Manage business information and categories
- **Product Management**: Add, edit, and remove products
- **Order Management**: View and manage incoming orders
- **Analytics**: Basic sales and performance metrics

### Admin Panel
- **User Management**: Admin controls for user accounts
- **Product Moderation**: Review and moderate product listings
- **System Monitoring**: Platform-wide analytics and monitoring

## 🛠️ Technology Stack

### Backend
- **Node.js** with **Express.js** - Server framework
- **MongoDB** with **Mongoose** - Database and ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Nodemailer** - Email services
- **Cloudinary** - Image storage and management
- **PDFKit** - PDF generation
- **Multer** - File upload handling

### Frontend
- **React 19** with **Vite** - Modern React development
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Notification system
- **Lucide React** - Icon library
- **Socket.io Client** - Real-time client communication

## 📁 Project Structure

```
LocalFinds/
├── README.md
├── TODO.md
├── backend/
│   ├── .gitignore
│   ├── app.js
│   ├── package.json
│   ├── package-lock.json
│   ├── socket.js
│   ├── db/
│   │   └── connection.js
│   ├── invoices/
│   │   ├── invoice_INV-1762579178138-0bddd7.pdf
│   │   ├── invoice_INV-1762579682462-afb1e5.pdf
│   │   ├── invoice_INV-1762579732837-c07b5d.pdf
│   │   ├── invoice_INV-1762781569656-83681e.pdf
│   │   ├── invoice_INV-1762868848854-a4db1f.pdf
│   │   ├── invoice_INV-1762868896425-a4dc7f.pdf
│   │   ├── invoice_INV-1762873086492-b71fa8.pdf
│   │   └── invoice_INV-1762873109360-b7223c.pdf
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── models/
│   │   ├── userModel.js
│   │   ├── productModel.js
│   │   ├── orderModel.js
│   │   ├── chatModel.js
│   │   ├── notificationModel.js
│   │   ├── invoiceModel.js
│   │   ├── inquiryModel.js
│   │   ├── reportModel.js
│   │   └── reviewModel.js
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── invoiceRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── inquiryRoutes.js
│   │   ├── reportRoutes.js
│   │   └── reviewRoutes.js
│   ├── utils/
│   │   └── pdfGenerator.js
│   └── .env
├── frontend/
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── axiosintreceptor.js
│       ├── index.css
│       ├── main.jsx
│       ├── assets/
│       │   ├── localfinds.png
│       │   └── logo.svg
│       ├── components/
│       │   ├── AccountSidebar.jsx
│       │   ├── CartContext.jsx
│       │   ├── CustomerReviews.jsx
│       │   ├── FeatureCard.jsx
│       │   ├── Footer.jsx
│       │   ├── Navbar.jsx
│       │   ├── NotificationBell.jsx
│       │   ├── ProductCard.jsx
│       │   ├── ProductCardSkeleton.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── Toast.jsx
│       │   └── WishlistContext.jsx
│       ├── contexts/
│       │   ├── NotificationContext.jsx
│       │   └── SocketContext.jsx
│       ├── hooks/
│       │   └── useDebounce.js
│       └── pages/
│           ├── AccountPage.jsx
│           ├── AdminDashboardPage.jsx
│           ├── CartPage.jsx
│           ├── ChatPage.jsx
│           ├── ForgotPasswordPage.jsx
│           ├── HelpPage.jsx
│           ├── LandingPage.jsx
│           ├── MarketPage.jsx
│           ├── OrderDetailsPage.jsx
│           ├── ProductDetailPage.jsx
│           ├── ResetPasswordPage.jsx
│           ├── SellerDashboardPage.jsx
│           ├── SignInPage.jsx
│           ├── SignUpPage.jsx
│           ├── StorePage.jsx
│           ├── VerificationPage.jsx
│           └── WishlistPage.jsx
```

## 🔧 Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud instance)
- **npm** or **yarn** package manager
- **Git** for version control

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the backend directory with the following variables:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/localfinds

   # JWT
   JWT_SECRET=your_jwt_secret_key_here

   # Email Configuration (Gmail)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Port
   PORT=5000
   ```

4. **Start the backend server:**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🔐 Authentication & Security

### User Roles
- **Buyer**: Can browse products, add to cart, place orders, chat with sellers
- **Seller**: Can list products, manage inventory, communicate with buyers, view sales
- **Admin**: Full platform management and moderation capabilities

### Security Features
- **Password Hashing**: bcryptjs for secure password storage
- **JWT Tokens**: Stateless authentication with refresh tokens
- **OTP Verification**: Email-based OTP for password reset
- **Input Validation**: Server-side validation for all user inputs
- **CORS Protection**: Configured CORS policies
- **Helmet Security**: Security headers and protections

## 📡 API Endpoints

### Authentication
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login
- `POST /api/user/forgot-password` - Request password reset OTP
- `POST /api/user/verify-otp` - Verify OTP for password reset
- `POST /api/user/reset-password` - Reset password with OTP

### Products
- `GET /api/products` - Get all products with filtering
- `POST /api/products` - Create new product (seller only)
- `PUT /api/products/:id` - Update product (seller only)
- `DELETE /api/products/:id` - Delete product (seller only)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `PUT /api/orders/:id` - Update order status

### Chat
- `GET /api/chat/:userId` - Get chat messages
- `POST /api/chat` - Send message

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode Ready**: CSS variables for theme switching
- **Loading States**: Skeleton loaders and loading indicators
- **Toast Notifications**: User feedback for actions
- **Form Validation**: Real-time form validation and error messages
- **Accessibility**: ARIA labels and keyboard navigation support

## 🚀 Deployment

### Backend Deployment
1. Set up a MongoDB database (MongoDB Atlas recommended)
2. Configure environment variables on your hosting platform
3. Deploy to services like Heroku, Railway, or DigitalOcean
4. Set up SSL certificate for HTTPS

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to static hosting services like Vercel, Netlify, or GitHub Pages
3. Configure API base URL for production environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the help section in the application

## 🔄 Future Enhancements

- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Advanced analytics dashboard
- [ ] Mobile app development (React Native)
- [ ] Multi-language support (i18n)
- [ ] Advanced search with AI recommendations
- [ ] Social features (product reviews, ratings)
- [ ] Delivery tracking integration
- [ ] Bulk order management
- [ ] API rate limiting and caching
- [ ] Real-time inventory management

---

**LocalFinds** - Connecting local communities through digital commerce 🛒✨
