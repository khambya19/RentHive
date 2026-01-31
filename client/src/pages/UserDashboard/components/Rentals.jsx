import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Key,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  MessageCircle,
  MoreVertical,
  Home,
  Bike
} from 'lucide-react';
import API_BASE_URL, { SERVER_BASE_URL } from '../../../config/api';
import ReviewModal from './ReviewModal';
import ListingDetail from './ListingDetail';

const Rentals = ({ rentals, loading, onRefresh, setActiveTab, showToast }) => {
  // Submit review to backend
  const handleSubmitReview = async ({ rating, comment, rental, existingReviewId }) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const isBike = rental.type === 'bike' || !!rental.dailyRate;

      // Get the correct property/bike ID - DO NOT use rental.id as fallback
      const actualPropertyId = !isBike ? rental.propertyId : null;
      const actualBikeId = isBike ? (rental.bikeId || rental.bikeBooking?.bikeId) : null;

      if (!actualPropertyId && !actualBikeId) {
        if (showToast) showToast('Cannot submit review: This rental is not linked to a valid property or bike.', 'error');
        throw new Error('Missing valid propertyId or bikeId in rental data');
      }

      // If updating existing review
      if (existingReviewId) {
        const updateBody = { rating, comment };
        await axios.put(`${API_BASE_URL}/reviews/${existingReviewId}`, updateBody);
        if (showToast) showToast('✅ Review updated successfully!', 'success');
      } else {
        // Creating new review
        const reviewBody = {
          userId: user?.id,
          reviewerName: user?.name || 'Anonymous',
          rating,
          comment,
          ...(actualPropertyId && { propertyId: actualPropertyId }),
          ...(actualBikeId && { bikeId: actualBikeId })
        };

        console.log('Submitting review:', reviewBody, 'Rental data:', { id: rental.id, propertyId: rental.propertyId, bikeId: rental.bikeId, type: rental.type });

        await axios.post(`${API_BASE_URL}/reviews/add`, reviewBody);
        if (showToast) showToast('✅ Review submitted successfully! Other users can now see your review.', 'success');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      if (error.response?.data?.error) {
        if (showToast) showToast(error.response.data.error, 'error');
      } else {
        if (showToast) showToast('Failed to submit review. Please try again.', 'error');
      }
      throw error;
    }
  };

  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all', 'property', 'bike'
  // Remove selectedRental and details panel logic
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRental, setReviewRental] = useState(null);

  const filteredRentals = rentals.filter(r => filter === 'all' || r.type === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse';
      case 'Completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-orange-50 text-orange-600 border-orange-100';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <button onClick={onRefresh} className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></button>
      </div>
    );
  }

  const handleDownloadReceipt = (rental) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RENT RECEIPT', 105, 25, { align: 'center' });

    // Company Info
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('RentHive Inc.', 14, 50);
    doc.text('Kathmandu, Nepal', 14, 55);
    doc.text('support@renthive.com', 14, 60);

    // Receipt Metadata
    doc.text(`Receipt #: REC-${rental.id.toString().padStart(6, '0')}`, 196, 50, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 196, 55, { align: 'right' });

    // Status Badge
    doc.setTextColor(22, 163, 74); // Green 600
    doc.setFont('helvetica', 'bold');
    doc.text('PAID', 196, 65, { align: 'right' });

    // Rental Details Line
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(14, 70, 196, 70);

    // Bill To
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To:', 14, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(rental.type === 'property' ? 'Tenant' : 'Renter', 14, 87);

    // Table
    const tableColumn = ["Description", "Dates", "Duration", "Amount"];
    const tableRows = [[
      rental.title,
      `${new Date(rental.startDate).toLocaleDateString()} - ${new Date(rental.endDate).toLocaleDateString()}`,
      `${Math.ceil((new Date(rental.endDate) - new Date(rental.startDate)) / (1000 * 60 * 60 * 24))} Days`,
      `Rs. ${Number(rental.cost).toLocaleString()}`
    ]];

    autoTable(doc, {
      startY: 95,
      head: [tableColumn],
      body: tableRows,
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      theme: 'grid'
    });

    // Total
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 150;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: Rs. ${Number(rental.cost).toLocaleString()}`, 196, finalY, { align: 'right' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for choosing RentHive!', 105, 280, { align: 'center' });

    doc.save(`Receipt_RentHive_${rental.id}.pdf`);
  };

  const handleContact = (rental) => {
    const chatState = {
      selectedUser: {
        id: rental.vendorId || rental.vendor?.id,
        name: rental.vendor?.name || 'Owner',
        email: rental.vendor?.email,
        profileImage: rental.vendor?.profileImage
      },
      context: {
        propertyId: rental.propertyId,
        bikeId: rental.bikeBooking?.bikeId,
        rentalId: rental.id,
        title: rental.title
      }
    };

    if (setActiveTab) {
      // Pass state via location so UserMessages picks it up
      navigate('/user/dashboard', { state: chatState, replace: true });
      setActiveTab('messages');
    } else {
      // Fallback or external navigation
      navigate('/user/dashboard', { state: chatState });
    }
  };


  // Handler to open review modal
  const handleOpenReview = async (rental) => {
    setReviewRental(rental);

    // Check if user already has a review for this property/bike
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const isBike = rental.type === 'bike' || !!rental.dailyRate;
      const queryParam = isBike ? `bikeId=${rental.bikeId}` : `propertyId=${rental.propertyId}`;

      const response = await axios.get(`${API_BASE_URL}/reviews?${queryParam}`);
      const existingReview = response.data.find(r => r.userId === user?.id);

      if (existingReview) {
        // Pre-fill with existing review
        setReviewRental({ ...rental, existingReview });
      }
    } catch (error) {
      console.error('Error checking existing review:', error);
    }

    setReviewModalOpen(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-12">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Rentals</h1>
          <p className="text-slate-500 font-medium">Manage your ongoing and upcoming bookings</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('property')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${filter === 'property' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Home size={14} /> Properties
          </button>
          <button
            onClick={() => setFilter('bike')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${filter === 'bike' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Bike size={14} /> Vehicles
          </button>
        </div>
      </div>

      {filteredRentals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-6">
            <Key size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No rentals found</h3>
          <p className="text-slate-500 mt-2 max-w-md">You haven't made any bookings yet. Browse our marketplace to find your next stay or ride.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRentals.map((rental) => (
            <div key={`${rental.type}-${rental.id}`} className="group bg-white rounded-2xl p-4 border border-slate-100 hover:border-orange-200 transition-all shadow-sm hover:shadow-md flex flex-col md:flex-row gap-6">
              {/* ...existing code for image and content... */}
              <div className="flex-1 flex flex-col justify-between py-2">
                {/* ...existing code for content... */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden">
                      <div className="w-full h-full bg-orange-200 flex items-center justify-center text-[10px] font-bold text-orange-700">
                        {(rental.vendor?.name?.[0] || 'V').toUpperCase()}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-600">Hosted by <span className="text-slate-900">{rental.vendor?.name || 'Partner'}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadReceipt(rental)}
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold uppercase rounded-lg transition-colors border border-slate-200"
                    >
                      Download Receipt
                    </button>
                    <button
                      onClick={() => handleContact(rental)}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase rounded-lg transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <MessageCircle size={14} /> Contact
                    </button>
                    <button
                      onClick={() => handleOpenReview(rental)}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold uppercase rounded-lg transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={handleSubmitReview}
        rental={reviewRental}
      />
    </div>
  );
};

export default Rentals;
