import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Loader2, Home, Bike, ArrowRight, Zap, ShieldCheck, Heart } from 'lucide-react';
import JoinRenthive from './joinRenthive';
import RR from './RR';
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';

import heroBackground from "../../assets/building.jpg"; 
import room1 from "../../assets/room1.jpg"; 
import flat2 from "../../assets/flat2.jpg"; 
import bike3 from "../../assets/bike3.jpg"; 

const defaultPropertyListings = [];
const defaultBikeListings = [];

const PropertyCard = ({ listing, onSeeMore }) => {
  const getImageUrl = (image) => {
    if (!image) return room1;
    if (typeof image !== 'string') return image;
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads')) return `${SERVER_BASE_URL}${image}`;
    return image;
  };

  return (
    <div className="group relative bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:-translate-y-2 flex flex-col h-full w-full max-w-[340px] mx-auto sm:max-w-none">
      <div className="relative h-64 overflow-hidden w-full">
        <img 
          src={getImageUrl(listing.image)} 
          alt={listing.title || 'Listing'} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          onError={(e) => { e.target.src = room1; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-slate-800 shadow-lg">
            {listing.type === 'property' ? listing.propertyType || 'Property' : 'Vehicle'}
          </div>
        </div>

        {listing.rating && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl flex items-center gap-1 shadow-lg border border-white/20">
            <Star size={12} className="text-amber-500 fill-amber-500" /> 
            <span className="text-xs font-black text-slate-800 tracking-tighter">{listing.rating}</span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow bg-white">
        <h3 className="text-xl font-black text-slate-800 mb-2 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight italic">
          {listing.title || 'Modern Listing'}
        </h3>
        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
          <MapPin size={14} className="text-indigo-500 flex-shrink-0" /> {listing.location || 'Nepal'}
        </p>

        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Rent Cost</p>
            <p className="font-black text-slate-900 text-lg tracking-tighter">
              NPR {typeof listing.price === 'number' ? listing.price.toLocaleString() : listing.price?.split(' ')[1] || '0'}
              <span className="text-[10px] font-bold text-slate-400">/{listing.type === 'property' ? 'mo' : 'day'}</span>
            </p>
          </div>
          <button 
            onClick={() => onSeeMore(listing)}
            className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all active:scale-95 shadow-lg group/btn"
          >
            <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export function Body() {
  const navigate = useNavigate();
  const [propertyListings, setPropertyListings] = useState(defaultPropertyListings);
  const [bikeListings, setBikeListings] = useState(defaultBikeListings);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchListings(); }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/public/listings?limit=10`);
      const data = await response.json();
      if (data.success && data.listings && data.listings.length > 0) {
        setPropertyListings(data.listings.filter(l => l.type === 'property').length > 0 ? data.listings.filter(l => l.type === 'property') : defaultPropertyListings);
        setBikeListings(data.listings.filter(l => l.type === 'bike').length > 0 ? data.listings.filter(l => l.type === 'bike') : defaultBikeListings);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSeeMore = () => {
    const token = localStorage.getItem('token');
    navigate(token ? '/user/dashboard' : '/login');
  };

  return (
    <main className="w-full min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[85vh] flex items-center justify-center overflow-hidden bg-slate-900">
        <img src={heroBackground} className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105 animate-pulse-slow" alt="Hero" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-white" />
        
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <Zap size={14} className="fill-indigo-400" /> Premium Rental Platform
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-slate-900 mb-6 tracking-tighter leading-[0.9] uppercase italic animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Rent Smarter <br /> <span className="text-indigo-600">Live Better.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed mb-10 opacity-80 animate-in fade-in duration-1000">
            Your trusted companion for finding luxury properties and elite vehicles across Nepal with absolute confidence.
          </p>
        </div>
      </section>

      {/* Modern Search */}
      <section className="relative z-30 -mt-16 sm:-mt-24 px-4 max-w-6xl mx-auto mb-20">
        <div className="bg-white rounded-[2.5rem] p-4 sm:p-6 shadow-2xl border border-slate-100 flex flex-col lg:flex-row gap-4 items-center animate-in zoom-in duration-700">
          <div className="flex-1 w-full relative">
            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500" size={20} />
            <input type="text" placeholder="Where are you looking?" className="w-full h-16 pl-14 pr-6 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-500 text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-medium" />
          </div>
          <div className="w-full lg:w-48">
            <select className="w-full h-16 px-6 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-500 text-slate-900 font-bold appearance-none cursor-pointer">
              <option>All Assets</option>
              <option>E-Properties</option>
              <option>Elite Motion</option>
            </select>
          </div>
          <button className="w-full lg:w-48 h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center justify-center gap-3">
            <Search size={20} /> Discover
          </button>
        </div>
      </section>

      {/* Listings Grid */}
      {['property', 'bike'].map((type) => (
        <section key={type} className="py-16 sm:py-24 max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
            <div className="max-w-xl">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter uppercase italic line-through decoration-indigo-500/30">
                {type === 'property' ? 'Exclusive Estates' : 'Elite Motion'}
              </h2>
              <p className="mt-4 text-slate-500 font-medium">Curated selection of our most prestigious listings currently available.</p>
            </div>
            <button onClick={handleSeeMore} className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-sm hover:gap-4 transition-all">
              View All <ArrowRight size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 justify-items-center">
            {(type === 'property' ? propertyListings : bikeListings).slice(0, 3).map((listing, i) => (
              <PropertyCard key={i} listing={listing} onSeeMore={handleSeeMore} />
            ))}
          </div>
        </section>
      ))}

      <section className="bg-slate-50 py-20 px-6 rounded-[3rem] mx-4 mb-20 overflow-hidden">
        <JoinRenthive />
      </section>
      
      <div className="mx-6">
        <RR />
      </div>
    </main>
  );
}

export default Body;