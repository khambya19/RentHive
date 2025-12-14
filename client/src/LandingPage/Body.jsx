import React from 'react';
import './Body.css';
import JoinRenthive from '../LandingPage/joinRenthive';
import RR from '../LandingPage/RR';


import heroBackground from "/src/assets/building.jpg"; 
import room1 from "/src/assets/room1.jpg"; 
import flat2 from "/src/assets/flat2.jpg"; 
import bike3 from "/src/assets/bike3.jpg"; 

import choiceImage1 from "/src/assets/choice_apartment.jpg";
import choiceImage2 from "/src/assets/choice_house.jpg";
import choiceImage3 from "/src/assets/choice_motorcyce.jpg";


const PropertyCard = ({ image, title, location, price, rating }) => (
  <div className="property-card">
    <div className="card-image-wrapper">
      <img src={image} alt={title} className="card-image" />
    </div>
    <div className="card-content">
      <div className="card-rating">{rating}</div>
      <h3 className="card-title">{title}</h3>
      <p className="card-location">Near {location}</p>
      <p className="card-price">{price}</p>
      <button className="card-button">See More</button>
    </div>
  </div>
);


export function Body() {
  return (
    <main className="body-container">
      
      
      <section 
        className="hero-section" 
        style={{ backgroundImage: `url(${heroBackground})` }} 
      >
        <div className="hero-overlay">
          <h1 className="hero-headline">"Rent Smarter Live Better"</h1>
          <p className="hero-tagline">
            Welcome to RentHive: your trusted platform for finding comfortable and property with ease. 
            Search, compare, and book in seconds.
          </p>
          
          
        </div>
      </section>

      
      <section className="">
        <div className="section-header">
            <div className="section-tabs">
            </div>
        </div>
        <div className="search-bar-secondary">
            <input type="text" placeholder="Location:" />
            <select><option>Type Room</option></select>
            <input type="text" placeholder="Price Range " />
            <button className="search-btn"><i className="fas fa-search"></i> Search</button>
        </div>
      </section>

      
      <section className="recommendation-section">
        <div className="section-header">
            <h2>Best Recommendation</h2>
            <div className="category-tags">
                
            </div>
            <div className="section-tabs">
                <button className="tab-active">All</button>
                <button>Flats</button>
                <button>Bikes</button>
            </div>
        </div>
      </section>

      
      <section className="recommendation-section">
    
        <div className="recommendation-grid-large">
          <PropertyCard
            image={room1} 
            title="Single Room"
            location="Kushahater"
            price="Rs 1200 per month"
            rating="3.2"
          />
          <PropertyCard
            image={flat2} 
            title="2 Bedroom Flat"
            location="Near Kalanki"
            price="Rs 17000 per month"
            rating="4.1"
          />
          <PropertyCard
            image={bike3} 
            title="Royal Enfield Classic 350"
            price="Rs 3500 per day"
            rating="4.3"
          />
        </div>
      </section>
      
      
      <section className="our-choice-grid">
          <div className="section-header">
            <h2>Our Choices</h2>
          </div>
        <div className="choice-grid">
            <PropertyCard
                image={choiceImage1}
                title="Near Bhaisipati" 
                
            />
            <PropertyCard
                image={choiceImage2} 
                title="Near Sanepa Height" 
                
            />
            <PropertyCard
                image={choiceImage3}
                title="Crossfire on Rent" 
                
            />
        </div>
      </section>


      <section id="signup-section">
      <JoinRenthive />
      </section>

      <RR />
      

    </main>
  );
}