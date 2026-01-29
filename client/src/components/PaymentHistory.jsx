import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Download, FileX, FileSpreadsheet, Banknote, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import './PaymentHistory.css';
import { SERVER_BASE_URL } from '../config/api';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'all',
    startDate: '',
    endDate: '',
    limit: 50
  });

  const fetchPaymentHistory = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);
      params.append('limit', filter.limit);

      const response = await axios.get(
        `${SERVER_BASE_URL}/api/payments/history?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPayments(response.data.payments);
      setStats(response.data.stats);
    } catch (error) {
      // console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount).toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      Paid: 'status-paid',
      Pending: 'status-pending',
      Overdue: 'status-overdue'
    };
    return <span className={`status-badge ${statusClasses[status]}`}>{status}</span>;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Property', 'Amount', 'Due Date', 'Status', 'Type'];
    const rows = payments.map(p => [
      formatDate(p.createdAt),
      p.Booking?.Property?.title || 'N/A',
      p.amount,
      formatDate(p.dueDate),
      p.status,
      p.tenantId === JSON.parse(localStorage.getItem('user')).id ? 'Paid' : 'Received'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="payment-history-container">
      <div className="history-header">
        <h2>Payment History</h2>
        <button onClick={exportToCSV} className="export-btn">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper blue">
              <FileSpreadsheet size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Transactions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper green">
              <Banknote size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatCurrency(stats.totalAmount)}</div>
              <div className="stat-label">Total Amount</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper teal">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value paid">{stats.paid}</div>
              <div className="stat-label">Paid</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper yellow">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value pending">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper red">
              <AlertCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value overdue">{stats.overdue}</div>
              <div className="stat-label">Overdue</div>
            </div>
          </div>
        </div>
      )}

      <div className="filters-section">
        <select 
          value={filter.type} 
          onChange={(e) => setFilter({...filter, type: e.target.value})}
          className="filter-select"
        >
          <option value="all">All Payments</option>
          <option value="tenant">Payments Made</option>
          <option value="owner">Payments Received</option>
        </select>

        <input
          type="date"
          value={filter.startDate}
          onChange={(e) => setFilter({...filter, startDate: e.target.value})}
          className="filter-input"
          placeholder="Start Date"
        />

        <input
          type="date"
          value={filter.endDate}
          onChange={(e) => setFilter({...filter, endDate: e.target.value})}
          className="filter-input"
          placeholder="End Date"
        />

        <select
          value={filter.limit}
          onChange={(e) => setFilter({...filter, limit: e.target.value})}
          className="filter-select"
        >
          <option value="25">Last 25</option>
          <option value="50">Last 50</option>
          <option value="100">Last 100</option>
          <option value="500">Last 500</option>
        </select>

        <button 
          onClick={() => setFilter({ type: 'all', startDate: '', endDate: '', limit: 50 })}
          className="clear-filters-btn"
        >
          Clear Filters
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading payment history...</div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <FileX size={48} color="#94a3b8" />
          <p>No payment history found</p>
        </div>
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Property</th>
                <th>Tenant</th>
                <th>Owner</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Paid On</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.createdAt)}</td>
                  <td className="property-cell">
                    <div className="property-name">{payment.Booking?.Property?.title || 'N/A'}</div>
                    <div className="property-location">{payment.Booking?.Property?.city || ''}</div>
                  </td>
                  <td>{payment.tenant?.fullName || 'N/A'}</td>
                  <td>{payment.owner?.fullName || 'N/A'}</td>
                  <td className="amount-cell">{formatCurrency(payment.amount)}</td>
                  <td>{formatDate(payment.dueDate)}</td>
                  <td>{getStatusBadge(payment.status)}</td>
                  <td>{payment.paidAt ? formatDate(payment.paidAt) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
