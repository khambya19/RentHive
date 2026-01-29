import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import PaymentHistory from './PaymentHistory';
import { 
  CreditCard, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  ClipboardList, 
  Inbox, 
  MapPin, 
  Banknote, 
  Calendar, 
  User, 
  Home, 
  FileText, 
  Check, 
  X,
  CreditCard as PaymentIcon
} from 'lucide-react';
import './PaymentManagement.css';

const PaymentManagement = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [activeTab, setActiveTab] = useState('current');
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: '',
    transactionId: '',
    notes: ''
  });

  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = user.type === 'owner' || user.type === 'vendor' 
        ? '/payments/owner' 
        : '/payments/tenant';
      
      let url = `${API_BASE_URL}${endpoint}`;
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      } else {
        showNotification('Failed to load payments', 'error');
      }
    } catch (error) {
      // console.error('Error fetching payments:', error);
      showNotification('Error loading payments', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, user.type, showNotification]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/payments/owner/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      // console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    if (user.type === 'owner' || user.type === 'vendor') {
      fetchStats();
    }
  }, [fetchPayments, fetchStats, user.type]);

  const handleMarkAsPaid = async () => {
    if (!paymentForm.paymentMethod) {
      showNotification('Please select a payment method', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/payments/${selectedPayment.id}/mark-paid`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentForm)
      });
      
      if (response.ok) {
        showNotification('✅ Payment marked as paid successfully!', 'success');
        setShowPaymentModal(false);
        setPaymentForm({ paymentMethod: '', transactionId: '', notes: '' });
        fetchPayments();
        if (stats) fetchStats();
      } else {
        showNotification('Failed to update payment', 'error');
      }
    } catch (error) {
      // console.error('Error marking payment:', error);
      showNotification('Error updating payment', 'error');
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyClass = (payment) => {
    if (payment.status === 'Paid') return 'paid';
    if (payment.status === 'Overdue') return 'overdue';
    
    const days = getDaysUntilDue(payment.dueDate);
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'warning';
    return 'normal';
  };

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status.toLowerCase() === filter;
  });

  if (loading) {
    return <div className="payment-loading">Loading payments...</div>;
  }

  return (
    <div className="payment-management">
      {notification.show && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="payment-header">
        <h2><PaymentIcon className="header-icon" /> Rent Payment Management</h2>
        <div className="tab-navigation">
          <button 
            className={activeTab === 'current' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('current')}
          >
            Current Payments
          </button>
          <button 
            className={activeTab === 'history' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('history')}
          >
            Payment History
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <PaymentHistory />
      ) : (
        <>
          <p className="subtitle">Track and manage your rent payments easily</p>
          
          {stats && (
            <div className="payment-stats">
              <div className="stat-card pending-card">
                <div className="stat-icon"><Clock size={24} /></div>
                <div className="stat-content">
                  <h3>Rs. {stats.totalPending?.toLocaleString() || 0}</h3>
                  <p>Pending Payments</p>
                </div>
              </div>
              <div className="stat-card overdue-card">
                <div className="stat-icon"><AlertTriangle size={24} /></div>
                <div className="stat-content">
                  <h3>Rs. {stats.totalOverdue?.toLocaleString() || 0}</h3>
                  <p>Overdue ({stats.overdueCount || 0} payments)</p>
                </div>
              </div>
              <div className="stat-card success-card">
                <div className="stat-icon"><CheckCircle size={24} /></div>
                <div className="stat-content">
                  <h3>Rs. {stats.totalCollected?.toLocaleString() || 0}</h3>
                  <p>Collected This Month</p>
                </div>
              </div>
            </div>
          )}

          <div className="payment-filters">
        <button 
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'} 
          onClick={() => setFilter('all')}
        >
          <span className="filter-icon"><ClipboardList size={16} /></span>
          All <span className="badge">{payments.length}</span>
        </button>
        <button 
          className={filter === 'pending' ? 'filter-btn active' : 'filter-btn'} 
          onClick={() => setFilter('pending')}
        >
          <span className="filter-icon"><Clock size={16} /></span>
          Pending <span className="badge">{payments.filter(p => p.status === 'Pending').length}</span>
        </button>
        <button 
          className={filter === 'overdue' ? 'filter-btn active' : 'filter-btn'} 
          onClick={() => setFilter('overdue')}
        >
          <span className="filter-icon"><AlertTriangle size={16} /></span>
          Overdue <span className="badge">{payments.filter(p => p.status === 'Overdue').length}</span>
        </button>
        <button 
          className={filter === 'paid' ? 'filter-btn active' : 'filter-btn'} 
          onClick={() => setFilter('paid')}
        >
          <span className="filter-icon"><CheckCircle size={16} /></span>
          Paid <span className="badge">{payments.filter(p => p.status === 'Paid').length}</span>
        </button>
      </div>

      <div className="payment-list">
        {filteredPayments.length === 0 ? (
          <div className="no-payments">
            <div className="empty-state">
              <div className="empty-icon"><Inbox size={48} /></div>
              <h3>No payments found</h3>
              <p>You don't have any {filter !== 'all' ? filter : ''} payments at the moment</p>
            </div>
          </div>
        ) : (
          filteredPayments.map(payment => (
            <div key={payment.id} className={`payment-card ${getUrgencyClass(payment)}`}>
              <div className="payment-card-header">
                <div className="property-info">
                  <h3>{payment.Booking?.property?.title || 'Property'}</h3>
                  <p className="payment-address"><MapPin size={14} /> {payment.Booking?.property?.address}</p>
                </div>
                <span 
                  className={`payment-status-badge ${payment.status.toLowerCase()}`}
                >
                  {payment.status}
                </span>
              </div>
              
              <div className="payment-details">
                <div className="detail-grid">
                  <div className="detail-item amount-highlight">
                    <span className="detail-label"><Banknote size={14} /> Amount</span>
                    <span className="detail-value">Rs. {payment.amount?.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><Calendar size={14} /> Due Date</span>
                    <span className="detail-value">{new Date(payment.dueDate).toLocaleDateString()}</span>
                    {payment.status !== 'Paid' && (
                      <span className={`days-indicator ${getUrgencyClass(payment)}`}>
                        {getDaysUntilDue(payment.dueDate) > 0 
                          ? `${getDaysUntilDue(payment.dueDate)} days left`
                          : `${Math.abs(getDaysUntilDue(payment.dueDate))} days overdue`
                        }
                      </span>
                    )}
                  </div>
                  {payment.paidDate && (
                    <div className="detail-item">
                      <span className="detail-label"><CheckCircle size={14} /> Paid On</span>
                      <span className="detail-value">{new Date(payment.paidDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">
                      {user.type === 'owner' || user.type === 'vendor' ? <><User size={14} /> Tenant</> : <><Home size={14} /> Owner</>}
                    </span>
                    <span className="detail-value">
                      {user.type === 'owner' || user.type === 'vendor' 
                        ? payment.tenant?.fullName 
                        : payment.owner?.fullName}
                    </span>
                  </div>
                  {payment.paymentMethod && (
                    <div className="detail-item">
                      <span className="detail-label"><CreditCard size={14} /> Method</span>
                      <span className="detail-value">{payment.paymentMethod}</span>
                    </div>
                  )}
                  {payment.transactionId && (
                    <div className="detail-item">
                      <span className="detail-label"><FileText size={14} /> Transaction ID</span>
                      <span className="detail-value">{payment.transactionId}</span>
                    </div>
                  )}
                </div>
                
                {payment.notes && (
                  <div className="payment-notes">
                    <strong><FileText size={14} /> Notes:</strong> {payment.notes}
                  </div>
                )}
              </div>
              
              {payment.status !== 'Paid' && (
                <div className="payment-actions">
                  <button 
                    className="btn-mark-paid"
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowPaymentModal(true);
                    }}
                  >
                    <span className="btn-icon"><Check size={16} /></span>
                    Mark as Paid
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showPaymentModal && (
        <div className="payment-modal-backdrop" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mark Payment as Paid</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
            </div>
            
            <div className="modal-body">
              <div className="payment-summary">
                <p><strong>Amount:</strong> Rs. {selectedPayment?.amount}</p>
                <p><strong>Due Date:</strong> {new Date(selectedPayment?.dueDate).toLocaleDateString()}</p>
              </div>
              
              <div className="form-group">
                <label>Payment Method</label>
                <select 
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                >
                  <option value="">Select method</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Online Payment">Online Payment</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Transaction ID (Optional)</label>
                <input 
                  type="text"
                  placeholder="Enter transaction ID"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({...paymentForm, transactionId: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea 
                  placeholder="Add any notes about the payment"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button className="btn-confirm" onClick={handleMarkAsPaid}>
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default PaymentManagement;
