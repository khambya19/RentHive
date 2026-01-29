import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const ReportModal = ({ isOpen, onClose, item, onReportSuccess }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reportReasons = [
    'Fake or misleading listing',
    'Inappropriate content or images',
    'Scam or fraud',
    'Property/Vehicle not available',
    'Incorrect pricing',
    'Duplicate listing',
    'Offensive or discriminatory content',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('token');

      await axios.post(
        `${apiUrl}/reports`,
        {
          listingType: item.type,
          listingId: item.id,
          reason,
          description
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (onReportSuccess) {
        onReportSuccess('Report submitted successfully! Thank you for helping keep our platform safe.');
      }
      onClose();
      setReason('');
      setDescription('');
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isProperty = item.type === 'property';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Report Listing</h2>
              <p className="text-sm text-gray-500">
                {isProperty ? item.title : `${item.brand} ${item.model}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for reporting <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              required
            >
              <option value="">Select a reason...</option>
              {reportReasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more information about this issue..."
              rows="4"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Info Text */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Your report will be reviewed by our team. False reports may result in account suspension.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
