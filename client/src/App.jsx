import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from "./context/AuthContext";
import NavBar from "./LandingPage/NavBar.jsx"; 
import { Body } from "./LandingPage/Body.jsx"; 
import Footer from "./LandingPage/Footer.jsx";
import LoginPage from "./pages/Login/Login.jsx";


function AppContent() {
    const location = useLocation();

    
    const showFooter = location.pathname !== '/login';

    return (
        <div className="App">
            
            {showNavBar && <NavBar />}
            
            <Routes> 
                <Route path="/" element={<Body />} /> 
                <Route path="/login" element={<LoginPage />} /> 
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