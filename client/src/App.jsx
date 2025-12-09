// RENTHIVE/client/src/App.jsx

import React from 'react';
// Ensure you have imported BrowserRouter as Router, Routes, and Route
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login'; 
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'; 
// import Register from './pages/Register/Register'; // We will add this soon

function App() {
  return (
    <Router>
      <Routes>
        {/* Route for the Login Page */}
        <Route path="/login" element={<Login />} />
        
        {/* Route for Forgot Password */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Placeholder for the Register Page (it's blank because this component doesn't exist yet) */}
        {/* For now, let's redirect to Login if Register is hit and doesn't exist: */}
        <Route path="/register" element={<Login />} /> 
        
        {/* Default route: Redirects all requests to '/' to '/login' */}
        <Route path="/" element={<Navigate to="/login" replace />} /> 
      </Routes>
    </Router>
  );
}

export default App;