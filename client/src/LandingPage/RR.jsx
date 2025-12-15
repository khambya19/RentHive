import React from 'react';
import './RR.css';


import edImg from "../assets/ed.jpg";
import khambeImg from "../assets/khambe.jpg";
import manishImg from "../assets/manish.jpg";
import rojenImg from "../assets/rojen.jpg";

const reviews = [
  {
    name: "Unish Khadka",
    image: edImg, 
    quote: "I found a flat within a day. The filters and verified listings made the whole process stress-free. Highly recommended!",
    gradientClass: "gradient-blue",
  },
  {
    name: "Khambe Prasad",
    image: khambeImg, 
    quote: "Booked a bike for a weekend trip, and everything went smoothly. No hidden charges, no hassle—just simple and fast service.",
    gradientClass: "gradient-green",
  },
  {
    name: "Manish Regmi",
    image: manishImg, 
    quote: "The KYC verification really helped me feel safe while dealing with owners. This is exactly what Nepal needed!",
    gradientClass: "gradient-pink",
  },
  {
    name: "Rojen Subedi",
    image: rojenImg, 
    quote: "Flats and bikes together? Perfect! Saved me so much time. The interface is clean, and the booking system is very convenient.",
    gradientClass: "gradient-yellow",
  },
];


const ReviewCard = ({ review }) => (
  <div className={`review-card ${review.gradientClass}`}>
    <div className="profile-container">
      
      <img src={review.image} alt={review.name} className="reviewer-image" />
      <h3 className="reviewer-name">{review.name}</h3>
    </div>
    
    <div className="quote-content">
      <span className="quote-mark">“</span>
      <p className="review-text">{review.quote}</p>
    </div>
  </div>
);



const RR = () => {
  return (
    <section className="renter-review-section">
      <h2 className="section-title">Renter’s Review</h2>
      <div className="review-grid">
        {reviews.map((review, index) => (
          <ReviewCard key={index} review={review} />
        ))}
      </div>
    </section>
  );
};

export default RR;