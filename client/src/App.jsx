import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import NavBar from "./pages/LandingPage/NavBar.jsx"; 
import { Body } from "./pages/LandingPage/Body.jsx"; 
import Footer from "./pages/LandingPage/Footer.jsx";
import LoginPage from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";
import RegisterUser from "./pages/RegisterUser/RegisterUser.jsx";
import RegisterOwner from "./pages/RegisterOwner/RegisterOwner.jsx";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx";
import UserDashboard from "./pages/UserDashboard/UserDashboard.jsx";
import OwnerDashboard from "./pages/OwnerDashboard/OwnerDashboard.jsx";

// Protected Route Component - Handles authentication & role-based access
const ProtectedRoute = ({ children, allowedTypes }) => {
    const { user, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>;
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedTypes && !allowedTypes.includes(user.type)) {
        // Redirect based on user type
        if (user.type === 'lessor') {
            return <Navigate to="/user/dashboard" replace />;
        } else if (user.type === 'owner' || user.type === 'vendor') {
            // Vendors are not lessors; treat them as part of the owner/vendor dashboard area
            return <Navigate to="/owner/dashboard" replace />;
        } else {
            return <Navigate to="/login" replace />;
        }
    }
    
    return children;
};

function AppContent() {
    const location = useLocation();

    // Hide navbar and footer on dashboard pages
    const isDashboard = location.pathname.startsWith('/user') || 
                       location.pathname.startsWith('/owner') ||
                       location.pathname.startsWith('/tenant');
    
    const showFooter = location.pathname !== '/login' && 
                       location.pathname !== '/register' &&
                       location.pathname !== '/register-user' && 
                       location.pathname !== '/register-owner' &&
                       location.pathname !== '/forgot-password' &&
                       !isDashboard;

    const showNavBar = !isDashboard;

    return (
        <div className="App">
            {showNavBar && <NavBar />}
            
            <Routes> 
                <Route path="/" element={<Body />} /> 
                <Route path="/login" element={<LoginPage />} /> 
                <Route path="/register" element={<Register />} />
                <Route path="/register-user" element={<RegisterUser />} />
                <Route path="/register-owner" element={<RegisterOwner />} />
                {/* Backward/alternate route used elsewhere in the app */}
                <Route path="/register-vendor" element={<RegisterOwner />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                
                {/* Protected Dashboard Routes */}
                
                {/* User/Tenant Dashboard - Browse and Rent Properties/Bikes */}
                <Route path="/user/dashboard" element={
                    <ProtectedRoute allowedTypes={['lessor']}>
                        <UserDashboard />
                    </ProtectedRoute>
                } />
                
                {/* Alias route for tenant dashboard */}
                <Route path="/tenant/dashboard" element={
                    <ProtectedRoute allowedTypes={['lessor']}>
                        <UserDashboard />
                    </ProtectedRoute>
                } />
                
                {/* Owner Dashboard - List and Manage Properties/Bikes */}
                <Route path="/owner/dashboard" element={
                    <ProtectedRoute allowedTypes={['owner']}>
                        <OwnerDashboard />
                    </ProtectedRoute>
                } />

                {/* Fallback for unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {showFooter && <Footer />}
        </div>
    );
}

function App() {
    return (
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter> 
            <AppContent />
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    );
}
  
export default App;