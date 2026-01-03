import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import NavBar from "./LandingPage/NavBar.jsx"; 
import { Body } from "./LandingPage/Body.jsx"; 
import Footer from "./LandingPage/Footer.jsx";
import LoginPage from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";
import RegisterVendor from "./pages/RegisterVendor/RegisterVendor.jsx";
import RegisterLessor from "./pages/RegisterLessor/RegisterLessor.jsx";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx";
import VendorDashboard from "./pages/VendorDashboard/VendorDashboard.jsx";
import PropertyManagementDashboard from "./pages/VendorDashboard/PropertyManagementDashboard.jsx";
import BikeVendorDashboard from "./pages/BikeVendorDashboard/BikeVendorDashboard.jsx";
import LessorDashboard from "./pages/LessorDashboard/LessorDashboard.jsx";

// Protected Route Component - Handles authentication & role-based access
const ProtectedRoute = ({ children, allowedTypes }) => {
    const { user, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>;
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedTypes && !allowedTypes.includes(user.type)) {
        // Redirect based on user type and business model
        if (user.type === 'vendor') {
            // Check if it's a bike vendor or property vendor
            if (user.businessType === 'bike-rental' || user.vendorType === 'bike') {
                return <Navigate to="/bike-vendor/dashboard" replace />;
            } else {
                return <Navigate to="/property-vendor/dashboard" replace />;
            }
        } else if (user.type === 'owner') {
            return <Navigate to="/property-vendor/dashboard" replace />;
        } else {
            return <Navigate to="/lessor/dashboard" replace />;
        }
    }
    
    return children;
};

function AppContent() {
    const location = useLocation();

    // Hide navbar and footer on dashboard pages
    const isDashboard = location.pathname.startsWith('/bike-vendor') || 
                       location.pathname.startsWith('/property-vendor') || 
                       location.pathname.startsWith('/vendor') || 
                       location.pathname.startsWith('/lessor');
    
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
                
                {/* Protected Dashboard Routes - Separated by Business Type */}
                
                {/* Bike Rental Vendor Dashboard */}
                <Route path="/bike-vendor/dashboard" element={
                    <ProtectedRoute allowedTypes={['vendor']}>
                        <BikeVendorDashboard />
                    </ProtectedRoute>
                } />
                
                {/* Property Management Vendor Dashboard */}
                <Route path="/property-vendor/dashboard" element={
                    <ProtectedRoute allowedTypes={['vendor', 'owner']}>
                        <PropertyManagementDashboard />
                    </ProtectedRoute>
                } />
                
                {/* Legacy vendor route - TEMPORARILY show BikeVendorDashboard */}
                <Route path="/vendor/dashboard" element={<BikeVendorDashboard />} />
                
                {/* Vendor Marketplace (Public view of all vendors) */}
                <Route path="/vendors" element={<VendorDashboard />} />
                
                {/* Customer/Renter Dashboard */}
                <Route path="/lessor/dashboard" element={
                    <ProtectedRoute allowedTypes={['lessor', 'renter']}>
                        <LessorDashboard />
                    </ProtectedRoute>
                } />

                {/* TEMPORARY: Direct access to test BikeVendorDashboard */}
                <Route path="/test/bike-dashboard" element={<BikeVendorDashboard />} />
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