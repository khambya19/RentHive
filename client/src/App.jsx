import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import NavBar from "./pages/LandingPage/NavBar.jsx";
import  Body from "./pages/LandingPage/Body.jsx";
import Footer from "./pages/LandingPage/Footer.jsx";
import LoginPage from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";
import RegisterVendor from "./pages/RegisterVendor/RegisterVendor.jsx";
import RegisterLessor from "./pages/RegisterLessor/RegisterLessor.jsx";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx";


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
                <Route path="/login" element={<LoginPage />} /> 
                <Route path="/register" element={<Register />} />
                <Route path="/register-vendor" element={<RegisterVendor />} />
                <Route path="/register-lessor" element={<RegisterLessor />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
            
            
            {showFooter && <Footer />}
        </div>
    );
}


function App() {
    return (
      
      <BrowserRouter> 
       
        <AppContent />
      </BrowserRouter>
    );
}
  
export default App;