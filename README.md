# ⚡ AroraCart — Full-Stack E-Commerce Platform

**AroraCart** is a modern, high-performance, full-stack e-commerce web application engineered for Next-Gen Tech & Smart Electronics. Built with a robust **Node.js + Express** backend, **MongoDB Atlas** cloud database, and a custom **Vanilla HTML5/CSS3/JavaScript** glassmorphism frontend.

Developed as part of the **CodeAlpha Full Stack Web Development Internship** (`CodeAlpha_EcommerceStore`).

---

## 📖 Project Overview

AroraCart provides a seamless online shopping experience for tech enthusiasts across India. The application features a rich, dark-mode glassmorphism interface, real-time product search and category filtering, responsive product cards, a persistent shopping cart, promo code verification, secure checkout with server-side validation, and interactive order fulfillment tracking.

---

## 🌟 Store Highlights & Capabilities

### 🛒 Core E-Commerce Functionality
- **Product Catalog & Live Search**: Instant multi-attribute search (title, brand, description) and real-time category filtering across 8 tech categories.
- **Product Details & Stock Status**: Detailed view with dynamic stock status indicators (*In Stock*, *Low Stock*, *Out of Stock*), price savings calculator, and technical specifications.
- **Shopping Cart Engine**: LocalStorage cart persistence, quantity controls, real-time subtotal calculation in Indian Rupees (₹ INR), and free shipping progress bar.
- **User Authentication (JWT + Bcrypt)**: Secure user registration and login with bcrypt password hashing, session persistence, and user profile navigation menu.
- **Server-Side Validated Checkout**: Server verifies database prices and stock availability before processing orders.
- **Order History & Management**: View past orders, payment methods, shipping addresses, and itemized breakdowns.
- **Database Seeder**: Automated seed script for initial 48-product catalog, promo coupons, and admin accounts.

### 💎 Advanced Enhancements
1. **❤️ Wishlist System**: Toggle favorite items with instant visual heart feedback and persistent account syncing.
2. **🏷️ Promo / Coupon Engine**: Real-time discount validation (e.g. `ARORA10` for 10% off, `WELCOME500` for ₹500 off).
3. **🔔 Toast Notification System**: Animated, non-blocking alert popups with progress bars replacing default browser alerts.
4. **📦 Fulfillment Timeline**: Interactive 4-step order progress tracker (*Pending ➔ Processing ➔ Shipped ➔ Delivered*).
5. **⭐ Customer Reviews & Ratings Engine**: Average rating calculation, interactive star selector, character counter, and customer review submission form.

---

## 💰 Currency & Regional Support
All pricing across product catalog, shopping cart, checkout, discount coupons, and backend calculations are strictly formatted in **Indian Rupees (₹ INR)** with proper standard formatting (`₹14,999`).

---

## 📂 Project Architecture & Folder Structure

```
CodeAlpha_EcommerceStore/
├── backend/
│   ├── config/
│   │   └── db.js            # Mongoose MongoDB connection initializer
│   ├── controllers/
│   │   ├── authController.js    # Registration, login, profile logic
│   │   ├── productController.js # Catalog, search, filters & reviews
│   │   ├── orderController.js   # Checkout validation & order tracking
│   │   ├── wishlistController.js# User wishlist manager
│   │   └── couponController.js  # Promo code verification engine
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT verification & role authorization
│   ├── models/
│   │   ├── User.js              # User schema with bcrypt password hashing
│   │   ├── Product.js           # Product schema with stock & ratings
│   │   ├── Order.js             # Order schema with items & shipping info
│   │   ├── Coupon.js            # Discount coupon schema
│   │   └── Review.js            # Customer reviews schema
│   ├── routes/                  # Express API route declarations
│   ├── seed.js                  # Database seeder script
│   ├── server.js                # Express app entry point & static server
│   └── package.json
├── frontend/
│   ├── css/
│   │   └── style.css        # Glassmorphism design system & styles
│   ├── js/
│   │   ├── api.js           # Fetch API client & INR currency formatter
│   │   ├── auth.js          # Authentication state & user menu dropdown
│   │   ├── cart.js          # Shopping cart state management
│   │   ├── cart-page.js     # Shopping cart UI logic & promo codes
│   │   ├── checkout.js      # Checkout form validation & submission
│   │   ├── login.js         # User login form handling
│   │   ├── main.js          # Catalog filters, search, pagination
│   │   ├── orders.js        # Order history & fulfillment timeline
│   │   ├── product.js       # Product details, reviews & related items
│   │   ├── register.js      # Registration form handling
│   │   ├── toast.js         # Toast notification system
│   │   └── wishlist.js      # Wishlist toggle & UI updates
│   ├── index.html           # Main store landing page
│   ├── product.html         # Product detail view
│   ├── cart.html            # Cart page
│   ├── checkout.html        # Checkout page
│   ├── orders.html          # Order tracking page
│   ├── login.html           # Sign in page
│   └── register.html        # Sign up page
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **MongoDB Atlas** database URI

### 1. Clone & Setup Backend
```bash
cd backend
npm install
```

### 2. Environment Configuration
Create a `.env` file inside the `backend` directory (or root for local execution):
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/aroracart?retryWrites=true&w=majority
JWT_SECRET=aroracart_secret_jwt_key_2026
```

### 3. Seed Database
Run the seed script to populate 48 products, 4 promo coupons, test users, and reviews:
```bash
npm run seed
```

### 4. Run Server
Start the Express server locally:
```bash
npm start
```
The server will run live on `http://localhost:5000`.

---

## 🔑 Test User Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@aroracart.com` | `Admin@123` |
| **Demo User** | `demo@aroracart.com` | `Demo@123` |

---

## 🏷️ Available Demo Coupons

| Code | Type | Value | Min Order |
|---|---|---|---|
| `ARORA10` | 10% Off | 10% | ₹2,000 |
| `WELCOME500` | Flat Off | ₹500 | ₹3,000 |
| `TECH20` | 20% Off | 20% | ₹5,000 |
| `SAVE1000` | Flat Off | ₹1,000 | ₹8,000 |

---

## 📡 API Endpoint Reference

### Auth Routes (`/api/auth`)
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Authenticate user & get JWT token
- `GET /api/auth/profile` — Get current user profile *(Protected)*

### Product Routes (`/api/products`)
- `GET /api/products` — Get products list (supports `category`, `search`, `sort`)
- `GET /api/products/:id` — Get single product by ID
- `POST /api/products/:id/reviews` — Submit product review *(Protected)*

### Order Routes (`/api/orders`)
- `POST /api/orders` — Create new order *(Protected)*
- `GET /api/orders/myorders` — Get current user's order history *(Protected)*
- `GET /api/orders/:id` — Get order details by ID *(Protected)*

### Coupon Routes (`/api/coupons`)
- `POST /api/coupons/apply` — Validate and apply promo code

### Wishlist Routes (`/api/wishlist`)
- `GET /api/wishlist` — Get user's wishlist *(Protected)*
- `POST /api/wishlist/toggle` — Add or remove product from wishlist *(Protected)*

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
