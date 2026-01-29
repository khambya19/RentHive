import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from "./pages/LandingPage/NavBar.jsx";
import Body from './pages/LandingPage/Body';
import Footer from "./pages/LandingPage/Footer.jsx";
import Login from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";
import RegisterOwner from "./pages/RegisterOwner/RegisterOwner.jsx";
import RegisterUser from "./pages/RegisterUser/RegisterUser.jsx";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx";
import UserDashboard from "./pages/UserDashboard/UserDashboard.jsx";
import OwnerDashboard from "./pages/OwnerDashboard/OwnerDashboard.jsx";
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import RatingPage from "./pages/RatingPage/RatingPage.jsx";


const ProtectedRoute = ({ children, allowedTypes }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    // Check both user.type and user.role for compatibility
    const userType = user.type || user.role;
    if (allowedTypes && !allowedTypes.includes(userType)) {
        // Redirect based on user type
        if (userType === 'renter' || userType === 'lessor') {
            return <Navigate to="/user/dashboard" replace />;
        } else if (userType === 'owner' || userType === 'vendor') {
            return <Navigate to="/owner/dashboard" replace />;
        } else {
            return <Navigate to="/login" replace />;
        }
    }
    return children;
};


function AppContent() {
    const location = useLocation();
    // Hide footer on auth pages AND dashboard pages
    const showFooter = location.pathname !== '/login' && 
                       location.pathname !== '/register' &&
                       location.pathname !== '/register-user' && 
                       location.pathname !== '/register-owner' &&
                       location.pathname !== '/forgot-password' &&
                       !location.pathname.startsWith('/user/dashboard') &&
                       !location.pathname.startsWith('/owner/dashboard');

    // Hide navbar on dashboard pages
    const showNavBar = !location.pathname.startsWith('/user/dashboard') &&
                       !location.pathname.startsWith('/owner/dashboard');

    return (
        <div className="App">
            {showNavBar && <NavBar />}
            <Routes>
                <Route path="/" element={<Body />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register-owner" element={<RegisterOwner />} />
                <Route path="/register-user" element={<RegisterUser />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/user/dashboard" element={
                    <ProtectedRoute allowedTypes={['lessor']}>
                        <UserDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/owner/dashboard" element={
                    <ProtectedRoute allowedTypes={['owner']}>
                        <OwnerDashboard />
                    </ProtectedRoute>
                } />
                {/* Admin Dashboard - Only for admin or super_admin users */}
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedTypes={['admin', 'super_admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/user/ratings" element={
                    <ProtectedRoute allowedTypes={['lessor', 'renter']}>
                        <RatingPage />
                    </ProtectedRoute>
                } />
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
                    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <AppContent />
                    </BrowserRouter>
                </SocketProvider>
            </AuthProvider>
        );
}

export default App;