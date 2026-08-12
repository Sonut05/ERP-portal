# Mini ERP + CRM Operations Portal

A full-stack ERP/CRM system for a wholesale/distribution company. Features customer management, product catalog with inventory tracking, stock movement logs, and sales order generation with automated stock deduction.

![Tech Stack](https://img.shields.io/badge/Node.js-TypeScript-green) ![React](https://img.shields.io/badge/React-TypeScript-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue) ![Three.js](https://img.shields.io/badge/Three.js-3D%20Background-purple)

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running Locally](#running-locally)
- [Docker Setup](#docker-setup)
- [API Documentation](#api-documentation)
- [Test Credentials](#test-credentials)
- [Deployment Guide](#deployment-guide)
- [Assumptions & Limitations](#assumptions--limitations)

---

## 🏗️ Architecture

```
┌─────────────┐     HTTP/REST     ┌──────────────┐     SQL      ┌────────────┐
│   React     │ ◄──────────────►  │  Express.js  │ ◄──────────► │ PostgreSQL │
│  Frontend   │                   │   Backend    │              │  Database  │
│  (Vite)     │                   │ (TypeScript) │              │            │
│  + Three.js │                   │  + JWT Auth  │              │  6 Tables  │
└─────────────┘                   └──────────────┘              └────────────┘
    Port 5173                        Port 5000                    Port 5432
```

**Key design decisions:**
- **Raw SQL with `pg` driver** — demonstrates direct SQL proficiency, no ORM abstraction
- **Modular architecture** — each feature (auth, customers, products, stock, orders) is a self-contained module with `router → controller → service → schema`
- **Transactional stock management** — order confirmation uses `BEGIN/COMMIT/ROLLBACK` to atomically deduct stock
- **Product snapshots** — order items store product name and price at time of creation, not just foreign keys

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | Node.js + TypeScript + Express.js | API server |
| Database | PostgreSQL 15 | Relational data store |
| Auth | JWT (jsonwebtoken) + bcryptjs | Authentication & password hashing |
| Validation | Zod | Request body validation with TypeScript inference |
| Frontend | React 18 + TypeScript (Vite) | UI framework |
| 3D Graphics | Three.js | Animated 3D particle background |
| Styling | Vanilla CSS (glassmorphism design system) | Premium dark UI |
| HTTP Client | Axios | API communication |
| Routing | React Router v6 | Client-side routing |
| State | React Context API | Auth state management |
| Containers | Docker + Docker Compose | Deployment |

---

## ✨ Features

### 🔐 Authentication & Roles
- JWT-based login with 4 roles: Admin, Sales, Warehouse, Accounts
- Role-based API route protection
- Role-based UI navigation filtering

### 👥 Customer CRM Module
- Full CRUD (Create, Read, Update)
- Search by name, business, email, mobile
- Filter by status (Lead/Active/Inactive) and type (Retail/Wholesale/Distributor)
- Paginated list view
- Detail view with follow-up notes timeline
- Quick-add follow-up notes with timestamps

### 📦 Product & Inventory Module
- Full CRUD with SKU uniqueness
- Search by name or SKU
- Low-stock alert filter (stock ≤ minimum threshold)
- Pulsing "Low" badge for at-risk items

### 🏭 Stock Movement Module
- Record IN (add) and OUT (remove) movements
- Transactional stock updates (prevents negative stock)
- Full audit trail with user, reason, and timestamp
- Product stock auto-updated on every movement

### 📋 Sales Order Module
- Multi-product order creation with live summary
- Auto-generated order numbers (ORD-YYYYMMDD-XXXX)
- Save as Draft or Confirm immediately
- **Confirmation deducts stock atomically** with transaction
- **Cancellation restores stock** with audit trail
- Product snapshot data (name + price at time of creation)
- Proper error for insufficient stock

### 🎨 UI/UX
- Stunning 3D animated background (Three.js particles, floating geometries, aurora lighting)
- Mouse-reactive camera movement
- Glassmorphism design system with 40+ reusable CSS classes
- Responsive layout (mobile sidebar, stacked grids)
- Toast notifications for all operations
- Smooth animations and micro-interactions

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** v14 or higher (running locally or remote)
- **npm** v9+

### 1. Clone the Repository

```bash
git clone <repo-url>
cd mini-erp-crm
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mini_erp_crm
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

Copy `.env.example` files and update values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

---

## 🗄️ Database Setup

### 1. Create the Database

```sql
CREATE DATABASE mini_erp_crm;
```

Or via command line:

```bash
createdb mini_erp_crm
```

### 2. Run Seed Script

The seed script creates all tables and inserts sample data:

```bash
cd backend
npm run seed
```

This will:
- Create all 6 tables (users, customers, products, stock_movements, orders, order_items)
- Seed 4 test users (Admin, Sales, Warehouse, Accounts)
- Seed 5 sample products
- Seed 3 sample customers

---

## ▶️ Running Locally

### Start Backend (Port 5000)

```bash
cd backend
npm run dev
```

### Start Frontend (Port 5173)

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 🐳 Docker Setup (Bonus)

```bash
# Build and start all services
docker-compose up --build

# Run seed script inside container
docker-compose exec backend npm run seed
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432

---

## 📡 API Documentation

### Base URL: `http://localhost:5000/api`

All protected routes require `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/login` | Public | Login and get JWT token |
| GET | `/auth/me` | All roles | Get current user profile |

### Customers
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/customers` | Admin, Sales, Accounts | List with search/filter/pagination |
| POST | `/customers` | Admin, Sales | Create customer |
| GET | `/customers/:id` | Admin, Sales, Accounts | Get customer detail |
| PUT | `/customers/:id` | Admin, Sales | Update customer |
| POST | `/customers/:id/notes` | Admin, Sales | Add follow-up note |

### Products
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/products` | All roles | List with search/filter/pagination |
| POST | `/products` | Admin, Warehouse | Create product |
| PUT | `/products/:id` | Admin, Warehouse | Update product |
| GET | `/products/:id/stock-movements` | Admin, Warehouse | Get stock history |

### Stock
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/stock/movements` | Admin, Warehouse | List all movements |
| POST | `/stock/movement` | Admin, Warehouse | Record IN/OUT movement |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/orders` | Admin, Sales, Accounts | List with filter/search |
| POST | `/orders` | Admin, Sales | Create order (Draft/Confirmed) |
| GET | `/orders/:id` | Admin, Sales, Accounts | Get order detail with items |
| PUT | `/orders/:id/status` | Admin, Sales | Update status (Confirm/Cancel) |

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard/stats` | All roles | Aggregated stats overview |

### Postman Collection

Import `postman_collection.json` from the project root into Postman. The collection auto-saves the JWT token on login.

---

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@erp.com | Admin@123 |
| Sales | sales@erp.com | Sales@123 |
| Warehouse | warehouse@erp.com | Warehouse@123 |
| Accounts | accounts@erp.com | Accounts@123 |

---

## 🚀 Deployment Guide

### Option A: Free Hosting (Recommended)

**Database: [Supabase](https://supabase.com) or [Neon](https://neon.tech)**
1. Create a free PostgreSQL instance
2. Get the connection string
3. Update backend `.env` with DB credentials

**Backend: [Render](https://render.com)**
1. Connect GitHub repo
2. Set build command: `cd backend && npm install && npm run build`
3. Set start command: `cd backend && node dist/server.js`
4. Add environment variables in Render dashboard

**Frontend: [Vercel](https://vercel.com) or [Netlify](https://netlify.com)**
1. Connect GitHub repo
2. Set root directory: `frontend`
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add `VITE_API_URL` environment variable pointing to deployed backend

### Option B: Docker

```bash
docker-compose up --build -d
docker-compose exec backend npm run seed
```

---

## 📝 Assumptions & Limitations

### Assumptions
- Single-warehouse model (location field is informational)
- Order numbers are unique per day with auto-incrementing counter
- Notes are appended as timestamped text (not separate table)
- Product stock is managed via stock movements + order confirmations
- All prices are in INR (₹)

### Known Limitations
- No password reset / registration flow (seed users only)
- No real-time notifications / WebSocket updates
- No file upload (product images, documents)
- No PDF invoice generation (bonus feature not implemented)
- Search is case-insensitive text matching (no full-text search)
- Pagination limited to numbered pages (no infinite scroll)

### What's Included (Bonus)
- ✅ Docker Compose setup
- ✅ Postman collection with auto-token
- ✅ Comprehensive seed data
- ✅ 3D animated background (Three.js)
- ✅ Glassmorphism premium UI design

---

## 📁 Project Structure

```
ERP - CRM portal/
├── backend/
│   ├── src/
│   │   ├── config/          # db.ts, env.ts, seed.ts
│   │   ├── middleware/      # auth.ts, roleCheck.ts, errorHandler.ts, validate.ts
│   │   ├── modules/
│   │   │   ├── auth/        # router, controller, service, schema
│   │   │   ├── customers/   # router, controller, service, schema
│   │   │   ├── products/    # router, controller, service, schema
│   │   │   ├── stock/       # router, controller, service, schema
│   │   │   └── orders/      # router, controller, service, schema
│   │   ├── utils/           # jwt.ts, response.ts, orderNumber.ts
│   │   └── server.ts
│   ├── .env / .env.example
│   ├── Dockerfile
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # axiosClient, auth, customers, products, stock, orders, dashboard
│   │   ├── components/      # ThreeBackground, Sidebar, ProtectedRoute
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Login, Dashboard, Customers, Products, StockMovements, Orders
│   │   ├── types/           # index.ts (all interfaces)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env / .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── postman_collection.json
└── README.md
```
