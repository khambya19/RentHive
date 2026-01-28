import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from "./pages/LandingPage/NavBar.jsx";
import Body from './pages/LandingPage/Body'; // Removed curly braces to match default export
import Footer from "./pages/LandingPage/Footer.jsx";
import Login from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";
import RegisterVendor from "./pages/RegisterVendor/RegisterVendor.jsx";
import RegisterLessor from "./pages/RegisterLessor/RegisterLessor.jsx";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx";
import UserDashboard from "./pages/UserDashboard/UserDashboard.jsx";
import OwnerDashboard from "./pages/OwnerDashboard/OwnerDashboard.jsx";
import { AuthProvider, useAuth } from './context/AuthContext.jsx'; 
import { SocketProvider } from './context/SocketContext.jsx';
import RatingPage from "./pages/RatingPage/RatingPage.jsx";

const ProtectedRoute = ({ children, allowedTypes }) => {
    const { user, loading } = useAuth(); // Now this will work because it's inside AuthProvider
    
    if (loading) return <div>Loading...</div>;
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedTypes && !allowedTypes.includes(user.type)) {
        if (user.type === 'lessor') {
            return <Navigate to="/user/dashboard" replace />;
        } else if (user.type === 'owner' || user.type === 'vendor') {
            return <Navigate to="/owner/dashboard" replace />;
        } else {
            return <Navigate to="/login" replace />;
        }
    }
    
    return children;
};

function AppContent() {
    const location = useLocation();
    
    const showFooter = location.pathname !== '/login' && 
                       location.pathname !== '/register' &&
                       location.pathname !== '/register-vendor' && 
                       location.pathname !== '/register-lessor' &&
                       location.pathname !== '/forgot-password';

    return (
        <div className="App">
            <NavBar /> 
            <Routes> 
                <Route path="/" element={<Body />} /> 
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register-vendor" element={<RegisterVendor />} />
                <Route path="/register-lessor" element={<RegisterLessor />} />
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
          <BrowserRouter> 
            <AppContent />
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    );
}

export default App;