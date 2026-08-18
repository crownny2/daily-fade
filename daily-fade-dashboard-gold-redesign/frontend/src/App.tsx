import { Routes, Route, Navigate } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { Landing } from '@/pages/Landing'
import { Services } from '@/pages/Services'
import { Barbers } from '@/pages/Barbers'
import { Booking } from '@/pages/Booking'
import { BookingConfirmation } from '@/pages/BookingConfirmation'
import { Login } from '@/pages/auth/Login'
import { Register } from '@/pages/auth/Register'
import { ForgotPassword } from '@/pages/auth/ForgotPassword'
import { MyAppointments } from '@/pages/customer/MyAppointments'
import { AppointmentDetails } from '@/pages/customer/AppointmentDetails'
import { Profile } from '@/pages/customer/Profile'
import { Notifications } from '@/pages/customer/Notifications'
import { NotFound } from '@/pages/NotFound'
import { Unauthorized } from '@/pages/Unauthorized'

// Barber portal (Phase 7C-1: dashboard + own appointments only).
import { BarberRoute } from '@/routes/BarberRoute'
import { BarberLayout } from '@/layouts/BarberLayout'
import { BarberDashboard } from '@/pages/barber/Dashboard'
import { BarberAppointments } from '@/pages/barber/Appointments'
import { BarberSchedule } from '@/pages/barber/Schedule'
import { BarberProfile } from '@/pages/barber/Profile'
import { BarberNotifications } from '@/pages/barber/Notifications'

// Admin — kept entirely separate from the customer PublicLayout above.
import { AdminRoute } from '@/routes/AdminRoute'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AdminLogin } from '@/pages/admin/Login'
import { AdminDashboard } from '@/pages/admin/Dashboard'
import { AdminAppointments } from '@/pages/admin/Appointments'
import { AdminServices } from '@/pages/admin/Services'
import { AdminBarbers } from '@/pages/admin/Barbers'
import { AdminBarberSchedules } from '@/pages/admin/BarberSchedules'
import { AdminPayments } from '@/pages/admin/Payments'
import { AdminCustomers } from '@/pages/admin/Customers'
import { AdminReports } from '@/pages/admin/Reports'
import { AdminNotifications } from '@/pages/admin/Notifications'
import { AdminSettingsPage } from '@/pages/admin/Settings'

function App() {
  return (
    <Routes>
      {/* Admin — not nested under PublicLayout, no customer nav/footer. */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="barbers" element={<AdminBarbers />} />
        <Route path="barber-schedules" element={<AdminBarberSchedules />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Barber — not nested under PublicLayout or AdminLayout. */}
      <Route
        path="/barber"
        element={
          <BarberRoute>
            <BarberLayout />
          </BarberRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<BarberDashboard />} />
        <Route path="appointments" element={<BarberAppointments />} />
        <Route path="schedule" element={<BarberSchedule />} />
        <Route path="notifications" element={<BarberNotifications />} />
        <Route path="profile" element={<BarberProfile />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/services" element={<Services />} />
        <Route path="/barbers" element={<Barbers />} />
        <Route path="/booking/confirmation" element={<BookingConfirmation />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/book"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-appointments"
          element={
            <ProtectedRoute>
              <MyAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-appointments/:id"
          element={
            <ProtectedRoute>
              <AppointmentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
