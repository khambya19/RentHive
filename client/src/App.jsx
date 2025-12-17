import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import NavBar from "./LandingPage/NavBar.jsx"; 
import { Body } from "./LandingPage/Body.jsx"; 
import Footer from "./LandingPage/Footer.jsx";
import LoginPage from "./pages/Login/Login.jsx";
import RegisterVendor from "./pages/RegisterVendor/RegisterVendor.jsx";
import RegisterLessor from "./pages/RegisterLessor/RegisterLessor.jsx";


function AppContent() {
    const location = useLocation();

    
    const showFooter = location.pathname !== '/login' && 
                       location.pathname !== '/register-vendor' && 
                       location.pathname !== '/register-lessor';

    return (
        <div className="App">
            
            <NavBar /> 
            
            <Routes> 
                <Route path="/" element={<Body />} /> 
                <Route path="/login" element={<LoginPage />} /> 
                <Route path="/register-vendor" element={<RegisterVendor />} />
                <Route path="/register-lessor" element={<RegisterLessor />} />
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