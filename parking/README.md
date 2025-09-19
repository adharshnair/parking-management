# ParkEasy - Comprehensive Parking Management System

A robust, full-stack parking management system built with React, Supabase, and Tailwind CSS. This application provides end-to-end functionality for parking slot booking, real-time availability tracking, QR code access, and comprehensive admin management.

## 🚀 Features

### User Features
- **User Authentication**: Secure registration and login with Supabase Auth
- **Real-time Parking Search**: Find available parking slots by location, vehicle type, and time
- **Online Booking**: Reserve parking slots with instant confirmation
- **QR Code Access**: Generate and scan QR codes for seamless entry/exit
- **Booking Management**: View, modify, and cancel bookings
- **Payment Integration**: Secure online payments (ready for integration)
- **Notifications**: Real-time booking updates and reminders
- **Mobile-First Design**: Responsive UI for all devices

### Admin Features
- **Dashboard Analytics**: Comprehensive overview of bookings, revenue, and occupancy
- **Parking Lot Management**: Add, edit, and manage parking locations and slots
- **Booking Oversight**: View and manage all user bookings
- **User Management**: Manage user accounts and permissions
- **QR Code Scanner**: Validate entry/exit QR codes
- **Reports & Analytics**: Detailed reporting on usage, revenue, and trends
- **Real-time Monitoring**: Live updates on parking availability

### Technical Features
- **Real-time Updates**: Supabase real-time subscriptions
- **Row Level Security**: Secure data access with Supabase RLS
- **Professional UI**: Built with shadcn/ui and Tailwind CSS
- **Type Safety**: Robust validation with Zod schemas
- **Performance Optimized**: Efficient queries and caching
- **Scalable Architecture**: Modular component structure

## 🛠️ Tech Stack

- **Frontend**: React 19.1.1, React Router, React Hook Form
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Validation**: Zod schema validation
- **Notifications**: Sonner toast notifications
- **QR Codes**: react-qr-code, html5-qrcode
- **Date Handling**: date-fns
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/              # Authentication components
│   ├── layout/            # Layout components (Header, Footer)
│   └── ui/                # shadcn/ui components
├── config/
│   └── supabase.js        # Supabase client configuration
├── context/
│   └── AuthContext.jsx    # Authentication context
├── hooks/
│   ├── useBookings.js     # Booking-related hooks
│   └── useParkingLots.js  # Parking lot hooks
├── pages/
│   ├── auth/              # Authentication pages
│   ├── user/              # User dashboard pages
│   └── admin/             # Admin dashboard pages
├── services/
│   ├── authService.js     # Authentication service
│   ├── bookingService.js  # Booking operations
│   ├── parkingService.js  # Parking lot operations
│   └── notificationService.js # Notification service
└── utils/
    ├── dateUtils.js       # Date/time utilities
    ├── helpers.js         # General helper functions
    └── qrCodeUtils.js     # QR code utilities
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Update `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database

Run the SQL script in `database-schema.sql` in your Supabase SQL editor to create:
- Database tables and relationships
- Row Level Security policies
- Database functions and triggers
- Indexes for performance

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📊 Database Schema

The system uses a comprehensive PostgreSQL schema with the following main tables:

- **profiles**: User profile information (extends Supabase auth.users)
- **parking_lots**: Parking location information
- **parking_slots**: Individual parking slots within lots
- **bookings**: Parking reservations and their status
- **payments**: Payment transactions
- **notifications**: User notifications
- **audit_logs**: System audit trail

### Key Features:
- Row Level Security (RLS) for data protection
- Automatic triggers for data consistency
- Optimized indexes for performance
- Comprehensive foreign key relationships

## 🔐 Authentication & Authorization

### User Roles
- **User**: Can search, book, and manage their own parking slots
- **Admin**: Full access to manage lots, bookings, users, and view analytics

### Security Features
- Supabase Authentication with email/password
- Row Level Security policies
- Protected routes with role-based access
- Secure API endpoints

---

**ParkEasy** - Making parking simple, convenient, and stress-free! 🚗✨+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
