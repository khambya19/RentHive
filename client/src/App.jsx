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
    const userRole = user.type || user.role;

    // Check if the user's role is in the allowed types
    if (allowedTypes && !allowedTypes.includes(userRole)) {
        // Redirect based on user role to their correct dashboard
        if (userRole === 'owner') {
            return <Navigate to="/owner/dashboard" replace />;
        } else if (['user', 'renter', 'lessor'].includes(userRole)) {
            return <Navigate to="/user/dashboard" replace />;
        } else if (userRole === 'vendor') {
            return <Navigate to="/vendor/dashboard" replace />;
        } else if (['admin', 'super_admin'].includes(userRole)) {
            return <Navigate to="/admin/dashboard" replace />;
        } else {
            // DEBUGGING: Show why access is denied
            return (
                <div style={{ padding: 20, textAlign: 'center', marginTop: 50 }}>
                    <h2>Access Denied</h2>
                    <p>Current User Type: <strong>{userRole || 'undefined'}</strong></p>
                    <p>Allowed Types: <strong>{allowedTypes ? allowedTypes.join(', ') : 'None'}</strong></p>
                    <p>User ID: {user.id}</p>
                    <button onClick={() => window.location.href = '/'}>Go Home</button>
                    &nbsp;
                    <button onClick={() => window.location.href = '/login'}>Login</button>
                </div>
            );
        }
    }
    return children;
};


function AppContent() {
    // console.log("AppContent rendered");
    const location = useLocation();
    // Hide footer on auth pages AND dashboard pages
    const showFooter = location.pathname !== '/login' &&
        location.pathname !== '/register' &&
        location.pathname !== '/register-user' &&
        location.pathname !== '/register-owner' &&
        location.pathname !== '/forgot-password' &&
        !location.pathname.startsWith('/user/dashboard') &&
        !location.pathname.startsWith('/owner/dashboard') &&
        !location.pathname.startsWith('/admin/dashboard');

    // Hide navbar on dashboard pages
    const showNavBar = !location.pathname.startsWith('/user/dashboard') &&
        !location.pathname.startsWith('/owner/dashboard') &&
        !location.pathname.startsWith('/admin/dashboard');

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
                    <ProtectedRoute allowedTypes={['user', 'renter', 'lessor']}>
                        <UserDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/owner/dashboard" element={
                    <ProtectedRoute allowedTypes={['owner', 'vendor']}>
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
                    <ProtectedRoute allowedTypes={['user', 'renter']}>
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