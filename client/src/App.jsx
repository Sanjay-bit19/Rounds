import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import HomePage from './pages/HomePage';
import BikeDetailPage from './pages/BikeDetailPage';
import BookingOTPPage from './pages/BookingOTPPage';
import ActiveRidePage from './pages/ActiveRidePage';
import InvoicePage from './pages/InvoicePage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import ProfilePage from './pages/ProfilePage';
import RideHistoryPage from './pages/RideHistoryPage';

const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function AppRoutes() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Routes>
        {/* Guest routes */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/verify-otp" element={<OTPVerificationPage />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/bike/:id" element={<ProtectedRoute><BikeDetailPage /></ProtectedRoute>} />
        <Route path="/booking/:id/otp" element={<ProtectedRoute><BookingOTPPage /></ProtectedRoute>} />
        <Route path="/ride/:id" element={<ProtectedRoute><ActiveRidePage /></ProtectedRoute>} />
        <Route path="/invoice/:id" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
        <Route path="/payment-success/:id" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><RideHistoryPage /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-[80vh] flex flex-col items-center justify-center">
            <h1 className="text-7xl font-extrabold bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">404</h1>
            <p className="mt-3 text-lg text-gray-500 font-medium">Page not found</p>
          </div>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              padding: '12px 16px',
              background: '#1e1b4b',
              color: '#e0e7ff',
              fontWeight: 500,
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
