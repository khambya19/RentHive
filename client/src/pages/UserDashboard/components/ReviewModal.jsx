import React, { useState, useEffect } from 'react';
import { Star, XCircle } from 'lucide-react';

const ReviewModal = ({ isOpen, onClose, onSubmit, rental }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill with existing review data if available
  useEffect(() => {
    if (rental?.existingReview) {
      setRating(rental.existingReview.rating);
      setComment(rental.existingReview.comment);
    } else {
      setRating(0);
      setComment('');
    }
  }, [rental]);

  if (!isOpen || !rental) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment) {
      setError('Please select a rating and enter a review.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ 
        rating, 
        comment, 
        rental,
        existingReviewId: rental.existingReview?.id 
      });
      setComment('');
      setRating(0);
      onClose();
    } catch (err) {
      setError('Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
          <XCircle size={24} />
        </button>
        <h2 className="text-xl font-black mb-4 text-slate-900">
          {rental.existingReview ? 'Update Your Review' : 'Leave a Review'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Your Rating:</span>
            {[1,2,3,4,5].map(star => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className={star <= rating ? 'text-yellow-400' : 'text-slate-300'}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                disabled={submitting}
              >
                <Star size={22} className={star <= rating ? 'fill-yellow-400' : ''} />
              </button>
            ))}
          </div>
          <textarea
            className="w-full p-2 rounded border border-slate-200 text-sm"
            rows={3}
            placeholder="Write your review..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            required
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !rating || !comment}
            className="w-full px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl disabled:bg-slate-300"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
          {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
