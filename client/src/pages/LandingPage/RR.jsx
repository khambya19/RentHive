import React from 'react';
// import './RR.css'; // Deprecated - using Tailwind CSS
import { Quote, Star } from 'lucide-react';


const reviews = [
  {
    name: "Unish Khadka",
    image: "/src/assets/ed.jpg", 
    quote: "I found a flat within a day. The filters and verified listings made the whole process stress-free. Highly recommended!",
    gradient: "from-indigo-400 to-purple-600",
  },
  {
    name: "Khambe Prasad",
    image: "/src/assets/khambe.jpg", 
    quote: "Booked a bike for a weekend trip, and everything went smoothly. No hidden charges, no hassle—just simple and fast service.",
    gradient: "from-green-300 to-emerald-500",
  },
  {
    name: "Manish Regmi",
    image: "/src/assets/manish.jpg", 
    quote: "The KYC verification really helped me feel safe while dealing with owners. This is exactly what Nepal needed!",
    gradient: "from-pink-300 to-blue-300",
  },
  {
    name: "Rojen Subedi",
    image: "/src/assets/rojen.jpg", 
    quote: "Flats and bikes together? Perfect! Saved me so much time. The interface is clean, and the booking system is very convenient.",
    gradient: "from-yellow-300 to-pink-500",
  },
];


const ReviewCard = ({ review }) => (
  <div className={`relative bg-white rounded-2xl shadow-md p-5 sm:p-6 border-2 border-transparent hover:shadow-xl transition-all duration-300`}>
    {/* Gradient border effect */}
    <div className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${review.gradient} opacity-30`} style={{ margin: '-2px' }}></div>
    
    {/* Profile */}
    <div className="text-center mb-4 pb-4 border-b border-gray-100">
      <img 
        src={review.image} 
        alt={review.name} 
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mx-auto mb-3 border-4 border-white shadow-md"
      />
      <h3 className="text-sm sm:text-base font-semibold text-gray-800">{review.name}</h3>
    </div>
    
    {/* Quote */}
    <div className="relative">
      <Quote size={24} className="text-gray-200 absolute -top-2 -left-1" />
      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-4 pr-2">{review.quote}</p>
      
      {/* Stars */}
      <div className="flex gap-0.5 mt-3 justify-center">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
        ))}
      </div>
    </div>
  </div>
);



const RR = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 text-center mb-8 sm:mb-12">
          <span className="border-b-4 border-gray-300 pb-2">User's Review</span>
        </h2>
        
        {/* Mobile: Horizontal Scroll | Desktop: Grid */}
        <div className="flex overflow-x-auto gap-4 pb-4 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 snap-x snap-mandatory">
          {reviews.map((review, index) => (
            <div key={index} className="flex-shrink-0 w-[280px] sm:w-auto snap-center">
              <ReviewCard review={review} />
            </div>
          ))}
        </div>
        
        {/* Mobile scroll hint */}
        <p className="text-center text-xs text-gray-400 mt-4 sm:hidden">← Swipe to see more reviews →</p>
      </div>
    </section>
  );
};

export default RR;