import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext.jsx'

// Layout Components
import Layout from './components/layout/Layout.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'

// Auth Pages
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx'

// Public Pages
import HomePage from './pages/HomePage.jsx'
import ParkingLotsPage from './pages/ParkingLotsPage.jsx'
import ParkingLotDetailPage from './pages/ParkingLotDetailPage.jsx'
import BookingPage from './pages/BookingPage.jsx'

// User Dashboard Pages
import DashboardPage from './pages/user/DashboardPage.jsx'
import BookingHistoryPage from './pages/user/BookingHistoryPage.jsx'
import ProfilePage from './pages/user/ProfilePage.jsx'
import NotificationsPage from './pages/user/NotificationsPage.jsx'

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminParkingLotsPage from './pages/admin/AdminParkingLotsPage.jsx'
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx'
import SlotsManagementPage from './pages/admin/SlotsManagementPage.jsx'
// import AdminUsersPage from './pages/admin/AdminUsersPage.jsx'
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx'
import QRScannerPage from './pages/admin/QRScannerPage.jsx'

// Error Pages
import NotFoundPage from './pages/NotFoundPage.jsx'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="parking-lots" element={<ParkingLotsPage />} />
              <Route path="parking-lots/:id" element={<ParkingLotDetailPage />} />
              <Route path="booking" element={<BookingPage />} />
              <Route path="book/:parkingLotId" element={<BookingPage />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected User Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="bookings" element={<BookingHistoryPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>

            {/* Protected Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboardPage />} />
              <Route path="parking-lots" element={<AdminParkingLotsPage />} />
              <Route path="slots" element={<SlotsManagementPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              {/* <Route path="users" element={<AdminUsersPage />} /> */}
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="qr-scanner" element={<QRScannerPage />} />
            </Route>

            {/* Redirect legacy routes */}
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/register" element={<Navigate to="/auth/register" replace />} />

            {/* 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
