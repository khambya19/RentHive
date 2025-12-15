import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import NavBar from "./LandingPage/NavBar.jsx"; 
import { Body } from "./LandingPage/Body.jsx"; 
import Footer from "./LandingPage/Footer.jsx";
import LoginPage from "./pages/Login/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx";
import JoinRenthive from "./LandingPage/joinRenthive";


function AppContent() {
    const location = useLocation();

    // Hide navbar and footer on login, register, and signup pages
    const showNavAndFooter = location.pathname !== '/login' && 
                             location.pathname !== '/register' && 
                             location.pathname !== '/forgot-password' &&
                             location.pathname !== '/signup';

    return (
        <div className="App">
            
            {showNavAndFooter && <NavBar />}
            
            <Routes> 
                <Route path="/" element={<Body />} /> 
                <Route path="/login" element={<LoginPage />} /> 
                <Route path="/signup" element={<JoinRenthive />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
            
            
            {showNavAndFooter && <Footer />}
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