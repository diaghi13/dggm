# DGGM ERP - Construction Management System

Complete ERP system for construction companies managing sites, quotes, time tracking, invoicing, and more.

## Project Structure

```
dggm/
├── backend/         Laravel 12 API (REST)
├── frontend/        Next.js 14 Web Application
└── README.md        This file
```

## Quick Start

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+ & npm
- MySQL 8.0+ or PostgreSQL 14+

### 1. Backend Setup

```bash
cd backend

# Install dependencies
composer install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Generate app key
php artisan key:generate

# Run migrations and seeders
php artisan migrate --seed

# Start server
composer dev
```

Backend will run on: **http://localhost:8000**

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will run on: **http://localhost:3000**

## Default Test Users

| Email | Password | Role |
|-------|----------|------|
| admin@dggm.com | password | Super Admin |
| pm@dggm.com | password | Project Manager |
| worker@dggm.com | password | Worker |

## Development

### Backend Commands

```bash
cd backend

# Development server (all services)
composer dev

# Run tests
composer test

# Code formatting
./vendor/bin/pint

# Database reset
php artisan migrate:fresh --seed
```

### Frontend Commands

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## Tech Stack

### Backend
- **Framework**: Laravel 12
- **Authentication**: Laravel Sanctum
- **Permissions**: Spatie Laravel Permission
- **Database**: MySQL/PostgreSQL
- **Testing**: Pest PHP
- **Code Style**: Laravel Pint

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **API Client**: Axios + React Query
- **Forms**: React Hook Form + Zod

## Architecture

**API-First Architecture**
- Backend provides RESTful API at `/api/v1/*`
- Frontend consumes API using Sanctum token authentication
- Complete separation of concerns
- Independent deployment capability

## Features

- ✅ **Authentication** - Login, logout, profile
- 🚧 **Customer Management** - CRUD customers (in progress)
- 📋 **Sites Management** - Construction sites
- 📝 **Quotes** - Estimates and proposals
- ⏱️ **Time Tracking** - GPS-based worker time tracking
- 📦 **Warehouse** - Inventory management
- 🚚 **Vehicles** - Fleet management
- 💰 **Invoicing** - Billing and payments
- 📊 **Reports** - Analytics and insights

## Documentation

- Backend API: See `backend/CLAUDE.md`
- Development Guide: See `backend/README_DEVELOPMENT.md`
- Frontend: See `frontend/README.md`

## License

MIT
