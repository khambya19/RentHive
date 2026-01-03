import React, { useState } from 'react';

const BikeAnalytics = ({ stats, bikes, bookings }) => {
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'quarter', 'year'
  const [chartType, setChartType] = useState('revenue'); // 'revenue', 'bookings', 'bikes'

  // Calculate bike performance metrics
  const getBikePerformance = () => {
    const bikeStats = bikes.map(bike => {
      const bikeBookings = bookings.filter(booking => booking.bike?.id === bike.id);
      const totalRevenue = bikeBookings.reduce((sum, booking) => sum + parseInt(booking.totalAmount || 0), 0);
      const totalDays = bikeBookings.reduce((sum, booking) => {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);

      return {
        ...bike,
        bookingCount: bikeBookings.length,
        totalRevenue,
        totalDays,
        utilization: totalDays > 0 ? ((totalDays / 365) * 100).toFixed(1) : 0
      };
    });

    return bikeStats.sort((a, b) => b.totalRevenue - a.totalRevenue);
  };

  // Calculate monthly revenue trend (mock data for now)
  const getRevenueData = () => {
    return [
      { month: 'Jan', revenue: 45000, bookings: 18 },
      { month: 'Feb', revenue: 52000, bookings: 22 },
      { month: 'Mar', revenue: 48000, bookings: 20 },
      { month: 'Apr', revenue: 61000, bookings: 25 },
      { month: 'May', revenue: 55000, bookings: 23 },
      { month: 'Jun', revenue: 67000, bookings: 28 }
    ];
  };

  // Get booking status distribution
  const getBookingStatusData = () => {
    const statusCounts = bookings.reduce((acc, booking) => {
      const status = booking.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / bookings.length) * 100).toFixed(1)
    }));
  };

  // Get bike type distribution
  const getBikeTypeData = () => {
    const typeCounts = bikes.reduce((acc, bike) => {
      const type = bike.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / bikes.length) * 100).toFixed(1)
    }));
  };

  const bikePerformance = getBikePerformance();
  const revenueData = getRevenueData();
  const bookingStatusData = getBookingStatusData();
  const bikeTypeData = getBikeTypeData();

  return (
    <div className="bike-analytics">
      {/* Analytics Header */}
      <div className="analytics-header">
        <div className="analytics-controls">
          <select 
            className="time-range-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          
          <div className="chart-type-toggle">
            <button 
              className={`toggle-btn ${chartType === 'revenue' ? 'active' : ''}`}
              onClick={() => setChartType('revenue')}
            >
              Revenue
            </button>
            <button 
              className={`toggle-btn ${chartType === 'bookings' ? 'active' : ''}`}
              onClick={() => setChartType('bookings')}
            >
              Bookings
            </button>
            <button 
              className={`toggle-btn ${chartType === 'bikes' ? 'active' : ''}`}
              onClick={() => setChartType('bikes')}
            >
              Bike Performance
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="analytics-metrics">
        <div className="metric-card">
          <div className="metric-icon revenue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3>NPR {stats.monthlyRevenue?.toLocaleString() || '0'}</h3>
            <p>Monthly Revenue</p>
            <span className="metric-trend positive">+12.5%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bookings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3>{stats.totalBookings || 0}</h3>
            <p>Total Bookings</p>
            <span className="metric-trend positive">+8.3%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon utilization">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3>{((stats.activeRentals / stats.totalBikes) * 100).toFixed(1) || 0}%</h3>
            <p>Fleet Utilization</p>
            <span className="metric-trend neutral">+2.1%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon avg-booking">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3>NPR {stats.totalBookings > 0 ? Math.round(stats.monthlyRevenue / stats.totalBookings).toLocaleString() : '0'}</h3>
            <p>Avg. Booking Value</p>
            <span className="metric-trend positive">+5.7%</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="analytics-charts">
        {/* Revenue Chart */}
        {chartType === 'revenue' && (
          <div className="chart-container">
            <h3>Revenue Trend</h3>
            <div className="revenue-chart">
              <div className="chart-bars">
                {revenueData.map((data, index) => (
                  <div key={data.month} className="bar-container">
                    <div 
                      className="revenue-bar"
                      style={{ 
                        height: `${(data.revenue / Math.max(...revenueData.map(d => d.revenue))) * 100}%` 
                      }}
                      title={`${data.month}: NPR ${data.revenue.toLocaleString()}`}
                    ></div>
                    <span className="bar-label">{data.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bookings Chart */}
        {chartType === 'bookings' && (
          <div className="chart-container">
            <h3>Booking Status Distribution</h3>
            <div className="status-chart">
              {bookingStatusData.map(item => (
                <div key={item.status} className="status-item">
                  <div className="status-bar">
                    <div 
                      className={`status-fill status-${item.status.toLowerCase()}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <div className="status-label">
                    <span className="status-name">{item.status}</span>
                    <span className="status-count">{item.count} ({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bike Performance Chart */}
        {chartType === 'bikes' && (
          <div className="chart-container">
            <h3>Top Performing Bikes</h3>
            <div className="bike-performance-list">
              {bikePerformance.slice(0, 10).map((bike, index) => (
                <div key={bike.id} className="performance-item">
                  <div className="rank">#{index + 1}</div>
                  <div className="bike-info">
                    <div className="bike-image">
                      {bike.images?.[0] ? (
                        <img 
                          src={`http://localhost:3001/uploads/bikes/${bike.images[0]}`} 
                          alt={bike.name}
                        />
                      ) : (
                        <div className="bike-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12V7a1 1 0 0 1 1-1h4l2-3h4a1 1 0 0 1 1 1v7.5"/>
                            <circle cx="8" cy="16" r="3"/>
                            <circle cx="16" cy="16" r="3"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="bike-details">
                      <h4>{bike.name}</h4>
                      <p>{bike.brand} {bike.model}</p>
                    </div>
                  </div>
                  <div className="performance-stats">
                    <div className="stat">
                      <span className="stat-label">Revenue</span>
                      <span className="stat-value">NPR {bike.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Bookings</span>
                      <span className="stat-value">{bike.bookingCount}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Utilization</span>
                      <span className="stat-value">{bike.utilization}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional Analytics */}
      <div className="analytics-grid">
        {/* Bike Type Distribution */}
        <div className="analytics-card">
          <h3>Bike Type Distribution</h3>
          <div className="type-distribution">
            {bikeTypeData.map(item => (
              <div key={item.type} className="type-item">
                <div className="type-info">
                  <span className="type-name">{item.type}</span>
                  <span className="type-count">{item.count} bikes</span>
                </div>
                <div className="type-bar">
                  <div 
                    className="type-fill"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="type-percentage">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="analytics-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {bookings.slice(0, 8).map(booking => (
              <div key={booking.id} className="activity-item">
                <div className="activity-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div className="activity-content">
                  <p className="activity-text">
                    <strong>{booking.customer?.fullName}</strong> booked <strong>{booking.bike?.name}</strong>
                  </p>
                  <span className="activity-time">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="activity-amount">
                  NPR {parseInt(booking.totalAmount || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="analytics-card">
          <h3>Peak Booking Hours</h3>
          <div className="hours-chart">
            {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hour => {
              const bookingCount = Math.floor(Math.random() * 15) + 1; // Mock data
              const maxBookings = 15;
              return (
                <div key={hour} className="hour-bar">
                  <div 
                    className="hour-fill"
                    style={{ height: `${(bookingCount / maxBookings) * 100}%` }}
                  ></div>
                  <span className="hour-label">{hour}:00</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Insights */}
        <div className="analytics-card">
          <h3>Customer Insights</h3>
          <div className="insights-list">
            <div className="insight-item">
              <div className="insight-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className="insight-content">
                <h4>New Customers</h4>
                <p>12 new customers this month</p>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18l4-4h14V3z"/>
                </svg>
              </div>
              <div className="insight-content">
                <h4>Customer Satisfaction</h4>
                <p>4.8/5 average rating</p>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </div>
              <div className="insight-content">
                <h4>Repeat Customers</h4>
                <p>67% repeat booking rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BikeAnalytics;