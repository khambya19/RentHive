import React, { useState, useEffect } from 'react';
import './RatingPage.css';
import API_BASE_URL from '../../config/api';
import { Star, User, MessageSquare, Send, Quote, ExternalLink } from 'lucide-react';

const RatingPage = () => {
  const [reviews, setReviews] = useState([]);
  const [formData, setFormData] = useState({ reviewerName: '', rating: 5, comment: '' });

  
  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews`);
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      // console.error("Connection Error:", err);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ reviewerName: '', rating: 5, comment: '' }); 
        fetchReviews(); 
      }
    } catch (err) {
      alert("Could not save to database. Is the server running?");
    }
  };

  return (
    <div className="clean-rating-page">
      <div className="content-wrapper">
        <header className="page-header">
          <h1><MessageSquare size={32} className="inline-icon" /> Ratings & Reviews</h1>
          <p>Read honest feedback from the RentHive community.</p>
        </header>

        <div className="layout-grid">
          {/* Form Side */}
          <section className="form-card">
            <h3><Quote size={20} className="inline-icon" /> Write a Review</h3>
            <form onSubmit={handleSubmit}>
              <div className="input-field">
                <label>Your Name</label>
                <input 
                  type="text" placeholder="Enter your full name" required
                  value={formData.reviewerName}
                  onChange={(e) => setFormData({...formData, reviewerName: e.target.value})}
                />
              </div>

              <div className="input-field">
                <label>Rating</label>
                <select 
                  value={formData.rating} 
                  onChange={(e) => setFormData({...formData, rating: Number(e.target.value)})}
                >
                  <option value="5">Excellent ⭐⭐⭐⭐⭐</option>
                  <option value="4">Very Good ⭐⭐⭐⭐</option>
                  <option value="3">Average ⭐⭐⭐</option>
                  <option value="2">Poor ⭐⭐</option>
                  <option value="1">Terrible ⭐</option>
                </select>
              </div>

              <div className="input-field">
                <label>Your Feedback</label>
                <textarea 
                  placeholder="What was your experience like?" required
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                />
              </div>

              <button type="submit" className="primary-btn">
                <Send size={18} style={{ marginRight: '8px' }} /> Submit Feedback
              </button>
            </form>
          </section>

          {/* List Side */}
          <section className="reviews-feed">
            <div className="feed-header">
              <h3>Community Feedback ({reviews.length})</h3>
            </div>
            
            <div className="scroll-container">
              {reviews.map((rev) => (
                <div key={rev.id} className="simple-review-card">
                  <div className="card-info">
                    <span className="user-avatar flex items-center justify-center">
                      <User size={20} />
                    </span>
                    <div>
                      <strong>{rev.reviewerName}</strong>
                      <div className="star-display flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            fill={i < rev.rating ? "#FFD700" : "none"} 
                            color={i < rev.rating ? "#FFD700" : "#d1d5db"} 
                          />
                        ))}
                      </div>
                    </div>
                    <span className="timestamp">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="comment">"{rev.comment}"</p>
                  <div className="card-footer">
                    <button className="link-btn flex items-center gap-1">
                      <ExternalLink size={14} /> View Linked Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RatingPage;