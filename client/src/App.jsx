
import React from "react";
import "./App.css";
import NavBar from "./LandingPage/NavBar.jsx"; 
import { Body } from "./LandingPage/Body.jsx"; 
import Footer from "./LandingPage/Footer.jsx";


function App() {
  return (
    <div className="App">
      <NavBar />
      <Body />
      <Footer/>
    </div>
  );
}

export default App;