import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from "./context/AuthContext";
import NavBar from "./LandingPage/NavBar.jsx"; 
import { Body } from "./LandingPage/Body.jsx"; 
import Footer from "./LandingPage/Footer.jsx";
import LoginPage from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";
import RegisterVendor from "./pages/RegisterVendor/RegisterVendor.jsx";
import RegisterLessor from "./pages/RegisterLessor/RegisterLessor.jsx";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx";

// TODO: Your friend will create these dashboard components
// import VendorDashboard from "./pages/Dashboard/VendorDashboard.jsx";
// import LessorDashboard from "./pages/Dashboard/LessorDashboard.jsx";

// Temporary placeholder components - Friend will replace with actual dashboards
const VendorDashboard = () => <div style={{padding: '50px', textAlign: 'center'}}><h1>Vendor Dashboard</h1><p>Coming soon...</p></div>;
const LessorDashboard = () => <div style={{padding: '50px', textAlign: 'center'}}><h1>Lessor Dashboard</h1><p>Coming soon...</p></div>;

// Protected Route Component - Handles authentication & role-based access
const ProtectedRoute = ({ children, allowedTypes }) => {
    const { user, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>;
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedTypes && !allowedTypes.includes(user.type)) {
        // Redirect to their correct dashboard
        if (user.type === 'vendor' || user.type === 'owner') {
            return <Navigate to="/vendor/dashboard" replace />;
        } else {
            return <Navigate to="/lessor/dashboard" replace />;
        }
    }
    
    return children;
};


function AppContent() {
    const location = useLocation();

    // Hide navbar and footer on dashboard pages
    const isDashboard = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/lessor');
    
    const showFooter = location.pathname !== '/login' && 
                       location.pathname !== '/register' &&
                       location.pathname !== '/register-vendor' && 
                       location.pathname !== '/register-lessor' &&
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
                <Route path="/register-vendor" element={<RegisterVendor />} />
                <Route path="/register-lessor" element={<RegisterLessor />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                
                {/* Protected Dashboard Routes - Friend will create actual dashboard components */}
                <Route path="/vendor/dashboard" element={
                    <ProtectedRoute allowedTypes={['vendor', 'owner']}>
                        <VendorDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/lessor/dashboard" element={
                    <ProtectedRoute allowedTypes={['lessor', 'renter']}>
                        <LessorDashboard />
                    </ProtectedRoute>
                } />
            </Routes>
            
            
            {showFooter && <Footer />}
        </div>
    );
}


function App() {
    return (
      <AuthProvider>
        <BrowserRouter> 
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    );
}
  
export default App;