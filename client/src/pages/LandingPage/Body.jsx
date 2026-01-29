import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Loader2, Home, Bike } from 'lucide-react';
import JoinRenthive from './joinRenthive';
import RR from './RR';
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';

import heroBackground from "../../assets/building.jpg"; 
import room1 from "../../assets/room1.jpg"; 
import flat2 from "../../assets/flat2.jpg"; 
import bike3 from "../../assets/bike3.jpg"; 

// Default placeholder listings when database is empty
const defaultPropertyListings = [
  {
    id: 'default-p1',
    type: 'property',
    title: 'Cozy Single Room',
    location: 'Kathmandu',
    price: 'Rs 8,000 per month',
    image: room1,
    rating: '4.2',
    isDefault: true
  },
  {
    id: 'default-p2',
    type: 'property',
    title: '2 Bedroom Flat',
    location: 'Lalitpur',
    price: 'Rs 18,000 per month',
    image: flat2,
    rating: '4.5',
    isDefault: true
  },
  {
    id: 'default-p3',
    type: 'property',
    title: 'Modern Apartment',
    location: 'Bhaktapur',
    price: 'Rs 25,000 per month',
    image: room1,
    rating: '4.8',
    isDefault: true
  }
];

const defaultBikeListings = [
  {
    id: 'default-b1',
    type: 'bike',
    title: 'Royal Enfield Classic 350',
    location: 'Kathmandu',
    price: 'Rs 2,500 per day',
    image: bike3,
    rating: '4.3',
    isDefault: true
  },
  {
    id: 'default-b2',
    type: 'bike',
    title: 'Honda CB Shine',
    location: 'Pokhara',
    price: 'Rs 1,500 per day',
    image: bike3,
    rating: '4.1',
    isDefault: true
  },
  {
    id: 'default-b3',
    type: 'bike',
    title: 'Yamaha FZ',
    location: 'Lalitpur',
    price: 'Rs 2,000 per day',
    image: bike3,
    rating: '4.4',
    isDefault: true
  }
];


const PropertyCard = ({ listing, onSeeMore }) => {
  // Handle image URL - could be from server or static assets
  const getImageUrl = (image) => {
    if (!image) return room1;
    if (typeof image !== 'string') return image;
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads')) return `${SERVER_BASE_URL}${image}`;
    return image;
  };

  // Format price properly - handle NaN cases
  const formatPrice = (price) => {
    if (!price) return 'Contact for price';
    if (typeof price === 'string') {
      // If already formatted string, return as is (unless it contains NaN)
      if (price.includes('NaN')) return 'Contact for price';
      return price;
    }
    // If it's a number, format it
    if (typeof price === 'number' && !isNaN(price)) {
      return `Rs ${price.toLocaleString()} per month`;
    }
    return 'Contact for price';
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1 group">
      <div className="relative h-36 sm:h-44 lg:h-52 overflow-hidden">
        <img 
          src={getImageUrl(listing.image)} 
          alt={listing.title || 'Listing'} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          onError={(e) => { e.target.src = room1; }}
        />
        {listing.rating && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md flex items-center gap-0.5 shadow-sm border border-gray-100">
            <Star size={10} className="text-yellow-400 fill-yellow-400" /> 
            <span className="text-[10px] sm:text-xs font-bold text-gray-800">{listing.rating}</span>
          </div>
        )}
        {/* Type Badge */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-blue-600/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
          {listing.type === 'property' ? <Home size={10} className="text-white" /> : <Bike size={10} className="text-white" />}
          <span className="text-[10px] font-medium text-white">{listing.type === 'property' ? 'Property' : 'Bike'}</span>
        </div>
      </div>
      <div className="p-2.5 sm:p-4">
        <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 truncate">{listing.title || 'Untitled'}</h3>
        {listing.location && (
          <p className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 mb-1.5">
            <MapPin size={10} className="text-gray-400" /> {listing.location}
          </p>
        )}
        <p className="font-bold text-blue-600 text-xs sm:text-sm mb-2">{formatPrice(listing.price)}</p>
        <button 
          onClick={() => onSeeMore(listing)}
          className="w-full py-1.5 sm:py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-[10px] sm:text-xs"
        >
          See More
        </button>
      </div>
    </div>
  );
};


export function Body() {
  const navigate = useNavigate();
  const [propertyListings, setPropertyListings] = useState(defaultPropertyListings);
  const [bikeListings, setBikeListings] = useState(defaultBikeListings);
  const [loading, setLoading] = useState(true);

  // Fetch listings on mount
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/public/listings?limit=10`);
      const data = await response.json();
      
      if (data.success && data.listings && data.listings.length > 0) {
        // Separate properties and bikes from real data
        const properties = data.listings.filter(l => l.type === 'property');
        const bikes = data.listings.filter(l => l.type === 'bike');
        
        // Use real data if available, otherwise use defaults
        setPropertyListings(properties.length > 0 ? properties : defaultPropertyListings);
        setBikeListings(bikes.length > 0 ? bikes : defaultBikeListings);
      } else {
        // Keep defaults if no data
        setPropertyListings(defaultPropertyListings);
        setBikeListings(defaultBikeListings);
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      // Use defaults on error
      setPropertyListings(defaultPropertyListings);
      setBikeListings(defaultBikeListings);
    } finally {
      setLoading(false);
    }
  };

  const handleSeeMore = (listing) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: `/browse/${listing.type}/${listing.id}` } });
      return;
    }
    navigate('/user-dashboard/browse');
  };

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-[#eaf6fa] via-[#d6eef5] to-[#b6e0fe]">
      {/* Hero Section */}
      <section 
        className="hero-section relative flex items-center justify-center text-center w-full px-0 sm:px-0 min-h-[280px] sm:min-h-[380px] lg:min-h-[480px]"
        style={{ backgroundImage: `url(${heroBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 w-full max-w-5xl mx-auto py-6 sm:py-12 md:py-20 lg:py-28 px-2 sm:px-8">
          <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-4">"Rent Smarter Live Better"</h1>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/90 max-w-2xl mx-auto px-2">
            Welcome to RentHive: your trusted platform for finding comfortable property with ease.
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="w-full px-0 sm:px-0 -mt-5 sm:-mt-8 relative z-20 flex justify-center">
        <div className="w-full max-w-4xl bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow-lg mx-2">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input type="text" placeholder="Location" className="flex-1 p-2 sm:p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm" />
            <select className="flex-1 p-2 sm:p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm">
              <option>All Types</option>
              <option>Property</option>
              <option>Automobile</option>
            </select>
            <input type="text" placeholder="Price Range" className="flex-1 p-2 sm:p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm" />
            <button className="w-full sm:w-auto bg-orange-500 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5 font-medium text-xs sm:text-sm">
              <Search size={14} /> Search
            </button>
          </div>
        </div>
      </section>

      {/* Property Section */}
      <section className="py-6 sm:py-10 lg:py-14 w-full px-0 sm:px-0">
        <div className="mb-4 sm:mb-6 text-center">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Property</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Featured rooms, flats & houses for rent</p>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500 text-sm">Loading...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-2 md:px-8 w-full">
            {propertyListings.slice(0, 3).map((listing) => (
              <PropertyCard 
                key={`property-${listing.id}`} 
                listing={listing} 
                onSeeMore={handleSeeMore}
              />
            ))}
          </div>
        )}
      </section>

      {/* Automobiles Section */}
      <section className="py-6 sm:py-10 lg:py-14 w-full px-0 sm:px-0 bg-gray-50">
        <div className="mb-4 sm:mb-6 text-center">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Automobiles</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Featured bikes & vehicles for rent</p>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500 text-sm">Loading...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-2 md:px-8 w-full">
            {bikeListings.slice(0, 3).map((listing) => (
              <PropertyCard 
                key={`bike-${listing.id}`} 
                listing={listing} 
                onSeeMore={handleSeeMore}
              />
            ))}
          </div>
        )}
      </section>

      <section id="signup-section" className="w-full px-0 md:px-0">
        <JoinRenthive />
      </section>

      <RR />
    </main>
  );
}

export default Body;